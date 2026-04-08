"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const colors = {
    success: { bg: "#1f844e", border: "#1f844e", icon: "\u2713" },
    error: { bg: "#ef4444", border: "#ef4444", icon: "\u2715" },
    info: { bg: "#3b82f6", border: "#3b82f6", icon: "\u2139" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container - top right */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-right"
              style={{ backgroundColor: "#131820", border: `1px solid ${c.border}`, minWidth: "200px" }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ backgroundColor: c.bg }}>
                {c.icon}
              </span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
