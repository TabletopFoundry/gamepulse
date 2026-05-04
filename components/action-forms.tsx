"use client";

import { useActionState, useEffect, useRef, type RefObject } from "react";
import { useToast } from "@/components/toast";
import { SubmitButton } from "@/components/submit-button";
import { submitCommunityReview, subscribeNewsletter, toggleUserList, toggleFollowCritic } from "@/lib/actions";
import type { ActionResult } from "@/lib/actions";
import type { ListType } from "@/lib/config";

function useActionToast(state: ActionResult | null, formRef?: RefObject<HTMLFormElement | null>) {
  const { addToast } = useToast();
  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      formRef?.current?.reset();
    } else if (state && !state.success) {
      addToast(state.message, "error");
    }
  }, [state, addToast, formRef]);
}

export function ReviewForm({
  gameSlug,
  gameId,
}: {
  gameSlug: string;
  gameId: number;
}) {
  const [state, formAction] = useActionState(submitCommunityReview, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, formRef);

  return (
    <form ref={formRef} action={formAction} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="path" value={`/games/${gameSlug}`} />
      <input type="hidden" name="slug" value={gameSlug} />
      <input type="hidden" name="gameId" value={gameId} />
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Your rating</span>
          <input name="rating" type="number" min="1" max="10" step="0.1" required className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-rose-300" placeholder="8.4" aria-label="Your rating from 1 to 10" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Your short review</span>
          <textarea name="review" required minLength={10} maxLength={280} rows={4} className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 focus:border-rose-300" placeholder="A sharp, specific take in 280 characters or fewer." aria-label="Your review text" />
        </label>
      </div>
      {state && !state.success ? (
        <p className="mt-3 text-sm text-red-600" role="alert">{state.message}</p>
      ) : null}
      <SubmitButton className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" pendingText="Saving…">Save rating</SubmitButton>
    </form>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useActionState(subscribeNewsletter, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, formRef);

  return (
    <form ref={formRef} action={formAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="path" value="/" />
      <input name="email" type="email" required placeholder="you@example.com" className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 ring-0 placeholder:text-slate-400 focus:border-rose-300" aria-label="Email address for newsletter" />
      {state && !state.success ? (
        <p className="text-sm text-red-600" role="alert">{state.message}</p>
      ) : null}
      <SubmitButton className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" pendingText="Subscribing…">Join the pulse</SubmitButton>
    </form>
  );
}

export function UserListForm({
  gameSlug,
  gameId,
  listType,
  children,
  className,
  pendingText,
}: {
  gameSlug: string;
  gameId: number;
  listType: ListType;
  children: React.ReactNode;
  className: string;
  pendingText: string;
}) {
  const [state, formAction] = useActionState(toggleUserList, null);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="path" value={`/games/${gameSlug}`} />
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="listType" value={listType} />
      <SubmitButton className={className} pendingText={pendingText}>{children}</SubmitButton>
    </form>
  );
}

export function FollowCriticForm({
  criticSlug,
  criticId,
  children,
  className,
  pendingText,
}: {
  criticSlug: string;
  criticId: number;
  children: React.ReactNode;
  className: string;
  pendingText: string;
}) {
  const [state, formAction] = useActionState(toggleFollowCritic, null);
  useActionToast(state);

  return (
    <form action={formAction} className="mt-5">
      <input type="hidden" name="path" value={`/critics/${criticSlug}`} />
      <input type="hidden" name="criticId" value={criticId} />
      <SubmitButton className={className} pendingText={pendingText}>{children}</SubmitButton>
    </form>
  );
}
