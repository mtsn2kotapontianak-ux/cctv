import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";

export type NavItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  roleLabel: string;
  title: string;
};

export function AppShell({ children, navItems, roleLabel, title }: AppShellProps) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "CCTV Digital Swanda";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--border)] bg-[var(--surface)] p-5 lg:block">
        <Link className="block" href="/login">
          <p className="text-sm font-semibold text-[var(--primary)]">Portal CCTV</p>
          <p className="mt-1 text-lg font-semibold">{appName}</p>
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">{roleLabel}</p>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="/account/password"
              >
                Ubah Password
              </Link>
              <form action={logoutAction}>
                <button
                  className="focus-ring rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  type="submit"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <Link
                className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
