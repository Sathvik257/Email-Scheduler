import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
  }
>;

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  const variants = {
    primary:
      "border border-[#0f766e] bg-[#0f766e] text-white shadow-teal-900/15 hover:-translate-y-0.5 hover:bg-[#115e59] hover:shadow-lg hover:shadow-teal-900/20",
    secondary:
      "border border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800",
    danger:
      "border border-rose-100 bg-rose-50 text-rose-700 hover:-translate-y-0.5 hover:bg-rose-100",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition duration-200 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
