"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

const TOAST_DISMISS_MS = 4000;
const RECENT_TOAST_WINDOW_MS = 1200;

const ToastContext = createContext<{
  addToast: (message: string, type: "success" | "error") => void;
}>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const recentRef = useRef(new Map<string, number>());

  // Clean up all pending timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const now = Date.now();
    const dedupeKey = `${type}:${message}`;
    for (const [key, shownAt] of recentRef.current) {
      if (now - shownAt > RECENT_TOAST_WINDOW_MS) {
        recentRef.current.delete(key);
      }
    }

    if (now - (recentRef.current.get(dedupeKey) ?? 0) < RECENT_TOAST_WINDOW_MS) {
      return;
    }
    recentRef.current.set(dedupeKey, now);

    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, TOAST_DISMISS_MS);
    timersRef.current.set(id, timer);
  }, []);

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed inset-x-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg backdrop-blur ${
              toast.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 shrink-0 rounded-full p-1 hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
