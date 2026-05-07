import Link from "next/link";
import type { Metadata } from "next";

import { UnsubscribeNewsletterForm } from "@/components/action-forms";
import { PageShell, SectionHeading } from "@/components/gamepulse-ui";

export const metadata: Metadata = {
  title: "Manage Newsletter",
  description: "Remove your email from the GamePulse newsletter list.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewsletterManagePage() {
  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Newsletter preferences</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Remove your email in a single step.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            GamePulse only stores your email address and signup timestamp for the weekly digest. Enter the same address below to delete it from the local newsletter list.
          </p>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading
            eyebrow="Self-serve deletion"
            title="Delete a newsletter signup"
            description="For privacy, use the same browser you used to subscribe so we can verify the local management token before deleting the email."
          />
          <div className="mt-6">
            <UnsubscribeNewsletterForm />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Need the digest again later? <Link href="/" className="font-semibold text-slate-700 underline underline-offset-4">Head back to the home page</Link> and re-subscribe anytime.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
