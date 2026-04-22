"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

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

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
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
