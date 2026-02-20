import React from "react";

export function Card({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props} />;
}

export function Badge({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`badge inline-flex items-center rounded-full px-3 py-1 text-xs ${className}`}
      {...props}
    />
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "soft" | "ghost";
};

export function Button({
  className = "",
  variant = "solid",
  ...props
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0";
  const v =
    variant === "ghost"
      ? "bg-transparent hover:bg-black/5"
      : variant === "soft"
        ? "bg-white/85 border border-(--stroke) hover:bg-white"
        : "bg-[linear-gradient(135deg,var(--accent),var(--accent2))] text-white shadow-sm";

  return <button className={`${base} ${v} ${className}`} {...props} />;
}
