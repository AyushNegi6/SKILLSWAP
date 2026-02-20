import * as React from "react";

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // ✅ wider so left/right gaps look balanced
  return <div className="mx-auto w-full max-w-[1480px] px-3">{children}</div>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-(--stroke) bg-white/70 backdrop-blur-sm shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-(--stroke) bg-white/70 px-3 py-1 text-xs text-(--muted2) shadow-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "default" | "ghost" | "soft";

export function Button({
  children,
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  // ✅ IMPORTANT: text colors forced so it never becomes white on white
  const styles =
    variant === "ghost"
      ? "bg-transparent text-(--text) hover:bg-black/5"
      : variant === "soft"
        ? "bg-white/70 text-(--text) hover:bg-white/90 border border-(--stroke)"
        : "bg-linear-to-r from-(--accent) to-(--accent2) text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] hover:brightness-105";

  return (
    <button className={cn(base, styles, className)} {...props}>
      {children}
    </button>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-(--stroke) bg-white/70 px-3 py-2 text-sm text-(--text) " +
          "placeholder:text-(--muted2) outline-none focus:ring-2 focus:ring-blue-400/20",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-(--stroke) bg-white/70 px-3 py-2 text-sm text-(--text) " +
          "placeholder:text-(--muted2) outline-none focus:ring-2 focus:ring-blue-400/20",
        className,
      )}
      {...props}
    />
  );
});
