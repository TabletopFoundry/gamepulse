"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/gamepulse";
import { MAX_REVIEW_LENGTH, MIN_REVIEW_LENGTH, LIST_TYPES } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult = {
  success: boolean;
  message: string;
};

const VALID_LIST_TYPES = new Set<string>(LIST_TYPES);
const EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const NEWSLETTER_EMAIL_COOKIE = "newsletter_email";
const NEWSLETTER_TOKEN_COOKIE = "newsletter_manage_token";

function getActionPath(formData: FormData, fallback: string) {
  const path = String(formData.get("path") ?? fallback);
  return path.startsWith("/") ? path : fallback;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeRating(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return Math.round(parsed * 10) / 10;
}

function revalidateCommunityPages(path: string) {
  revalidatePath(path);
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/me");
  revalidatePath("/critics");
  revalidatePath("/critics/[slug]", "page");
}

function newsletterCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export async function submitCommunityReview(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const limit = await rateLimit("submitCommunityReview", 5);
  if (!limit.allowed) return { success: false, message: limit.message };

  const db = getDb();
  const user = getCurrentUser();
  const gameId = Number(formData.get("gameId"));
  const slug = String(formData.get("slug") ?? "");
  const path = getActionPath(formData, `/games/${slug}`);
  const rating = normalizeRating(formData.get("rating"));
  const review = String(formData.get("review") ?? "").trim().slice(0, MAX_REVIEW_LENGTH);

  if (!gameId || !slug || !Number.isInteger(gameId) || gameId <= 0) {
    return { success: false, message: "Invalid game. Please try again." };
  }

  const gameExists = db.prepare(`SELECT id FROM games WHERE id = ?`).get(gameId);
  if (!gameExists) return { success: false, message: "Game not found." };
  if (Number.isNaN(rating) || rating < 1 || rating > 10) {
    return { success: false, message: "Rating must be between 1 and 10." };
  }
  if (review.length < MIN_REVIEW_LENGTH) {
    return { success: false, message: `Review must be at least ${MIN_REVIEW_LENGTH} characters.` };
  }

  try {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO community_reviews (game_id, user_id, rating, review, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(game_id, user_id)
        DO UPDATE SET rating = excluded.rating, review = excluded.review, created_at = excluded.created_at
      `).run(gameId, user.id, rating, review);

      const stats = db.prepare(`SELECT ROUND(AVG(rating) * 10) as avgScore, COUNT(*) as count FROM community_reviews WHERE game_id = ?`).get(gameId) as { avgScore: number; count: number };
      db.prepare(`UPDATE games SET community_score = ?, community_reviews_count = ? WHERE id = ?`).run(stats.avgScore ?? 0, stats.count ?? 0, gameId);
    })();
  } catch {
    return { success: false, message: "Failed to save review. Please try again." };
  }

  revalidateCommunityPages(path);

  return { success: true, message: "Review saved successfully!" };
}

export async function toggleUserList(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const limit = await rateLimit("toggleUserList", 15);
  if (!limit.allowed) return { success: false, message: limit.message };

  const db = getDb();
  const user = getCurrentUser();
  const gameId = Number(formData.get("gameId"));
  const listType = String(formData.get("listType") ?? "watchlist");
  const path = getActionPath(formData, "/me");

  if (!VALID_LIST_TYPES.has(listType)) {
    return { success: false, message: "Invalid list type." };
  }

  if (!gameId || !Number.isInteger(gameId) || gameId <= 0) return { success: false, message: "Invalid game. Please try again." };

  const gameExists = db.prepare(`SELECT id FROM games WHERE id = ?`).get(gameId);
  if (!gameExists) return { success: false, message: "Game not found." };

  try {
    const existing = db.prepare(`SELECT id FROM user_lists WHERE user_id = ? AND game_id = ? AND list_type = ?`).get(user.id, gameId, listType) as { id: number } | undefined;

    if (existing) {
      db.prepare(`DELETE FROM user_lists WHERE id = ?`).run(existing.id);
      revalidatePath(path);
      revalidatePath("/me");
      return { success: true, message: `Removed from ${listType}` };
    }

    db.prepare(`INSERT INTO user_lists (user_id, game_id, list_type, created_at) VALUES (?, ?, ?, datetime('now'))`).run(user.id, gameId, listType);
    revalidatePath(path);
    revalidatePath("/me");
    return { success: true, message: `Added to ${listType}` };
  } catch {
    return { success: false, message: `Failed to update ${listType}. Please try again.` };
  }
}

export async function toggleFollowCritic(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const limit = await rateLimit("toggleFollowCritic", 15);
  if (!limit.allowed) return { success: false, message: limit.message };

  const db = getDb();
  const user = getCurrentUser();
  const criticId = Number(formData.get("criticId"));
  const path = getActionPath(formData, "/critics");

  if (!criticId || !Number.isInteger(criticId) || criticId <= 0) return { success: false, message: "Invalid critic. Please try again." };

  const criticExists = db.prepare(`SELECT id FROM critics WHERE id = ?`).get(criticId);
  if (!criticExists) return { success: false, message: "Critic not found." };

  try {
    const existing = db.prepare(`SELECT id FROM follows WHERE user_id = ? AND critic_id = ?`).get(user.id, criticId) as { id: number } | undefined;
    if (existing) {
      db.prepare(`DELETE FROM follows WHERE id = ?`).run(existing.id);
      revalidatePath(path);
      revalidatePath("/me");
      return { success: true, message: "Unfollowed critic" };
    }

    db.prepare(`INSERT INTO follows (user_id, critic_id, created_at) VALUES (?, ?, datetime('now'))`).run(user.id, criticId);
    revalidatePath(path);
    revalidatePath("/me");
    return { success: true, message: "Now following critic" };
  } catch {
    return { success: false, message: "Failed to update follow. Please try again." };
  }
}

export async function subscribeNewsletter(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const limit = await rateLimit("subscribeNewsletter", 5);
  if (!limit.allowed) return { success: false, message: limit.message };

  const db = getDb();
  const cookieStore = await cookies();
  const email = normalizeEmail(formData.get("email"));

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  try {
    const manageToken = randomUUID();
    db.transaction(() => {
      db.prepare(`INSERT OR IGNORE INTO newsletter_signups (email, created_at) VALUES (?, datetime('now'))`).run(email);
      db.prepare(`
        INSERT INTO newsletter_manage_tokens (email, token, created_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(email)
        DO UPDATE SET token = excluded.token, created_at = excluded.created_at
      `).run(email, manageToken);
    })();

    cookieStore.set(NEWSLETTER_EMAIL_COOKIE, email, newsletterCookieOptions());
    cookieStore.set(NEWSLETTER_TOKEN_COOKIE, manageToken, newsletterCookieOptions());
  } catch {
    return { success: false, message: "Failed to subscribe. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/newsletter/manage");

  return { success: true, message: "You're in! Check your inbox." };
}

export async function deleteNewsletterSignup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const limit = await rateLimit("deleteNewsletterSignup", 5);
  if (!limit.allowed) return { success: false, message: limit.message };

  const db = getDb();
  const cookieStore = await cookies();
  const email = normalizeEmail(formData.get("email"));

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  try {
    const cookieEmail = cookieStore.get(NEWSLETTER_EMAIL_COOKIE)?.value ?? "";
    const cookieToken = cookieStore.get(NEWSLETTER_TOKEN_COOKIE)?.value ?? "";
    const tokenRow = db.prepare(`SELECT token FROM newsletter_manage_tokens WHERE email = ?`).get(email) as { token: string } | undefined;

    if (cookieEmail === email && cookieToken && tokenRow?.token === cookieToken) {
      db.transaction(() => {
        db.prepare(`DELETE FROM newsletter_signups WHERE email = ?`).run(email);
        db.prepare(`DELETE FROM newsletter_manage_tokens WHERE email = ?`).run(email);
      })();
      cookieStore.delete(NEWSLETTER_EMAIL_COOKIE);
      cookieStore.delete(NEWSLETTER_TOKEN_COOKIE);
    }

    revalidatePath("/newsletter/manage");
    return { success: true, message: "If that email was subscribed, it has been removed." };
  } catch {
    return { success: false, message: "Failed to update newsletter preferences. Please try again." };
  }
}
