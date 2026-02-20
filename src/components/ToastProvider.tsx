"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: string; title: string; desc?: string; kind?: "ok" | "err" };

const ToastCtx = createContext<{
  push: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const api = useMemo(
    () => ({
      push: (t: Omit<Toast, "id">) => {
        const id = `${Date.now()}-${Math.random()}`;
        const toast: Toast = { id, kind: "ok", ...t };
        setItems((p) => [toast, ...p].slice(0, 4));
        setTimeout(() => {
          setItems((p) => p.filter((x) => x.id !== id));
        }, 2800);
      },
    }),
    [],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed right-3 top-3 z-[999] flex w-[340px] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`card p-3 ${
              t.kind === "err" ? "border-red-500/30" : ""
            }`}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.desc ? (
              <div className="mt-0.5 text-sm text-(--muted)">{t.desc}</div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
