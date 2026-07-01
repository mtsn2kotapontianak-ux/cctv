import Link from "next/link";

type ActionPanelProps = {
  description?: string;
  href: string;
  label: string;
  title: string;
};

export function ActionPanel({ description, href, label, title }: ActionPanelProps) {
  return (
    <Link
      className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--primary)]"
      href={href}
    >
      <p className="text-lg font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      <p className="mt-4 text-sm font-semibold text-[var(--primary)]">{label}</p>
    </Link>
  );
}
