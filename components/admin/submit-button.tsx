"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]",
  danger: "border border-red-200 bg-red-50 text-[var(--danger)] hover:bg-red-100"
};

export function SubmitButton({
  children,
  pendingLabel = "Memproses...",
  variant = "primary",
  ...buttonProps
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]}`}
      disabled={pending}
      type="submit"
      {...buttonProps}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
