"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  pendingText,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} className={className} aria-disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
