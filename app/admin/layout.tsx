import { AppShell, type NavItem } from "@/components/layout/app-shell";

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/classes", label: "Kelas" },
  { href: "/admin/cameras", label: "Kamera" },
  { href: "/admin/mapping", label: "Pemetaan" },
  { href: "/admin/monitoring", label: "Monitoring" },
  { href: "/admin/logs", label: "Log Aktivitas" }
];

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell navItems={adminNavItems} roleLabel="Admin" title="Dasbor Admin">
      {children}
    </AppShell>
  );
}
