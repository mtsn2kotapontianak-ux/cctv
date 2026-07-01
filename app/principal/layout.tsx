import { AppShell, type NavItem } from "@/components/layout/app-shell";

const principalNavItems: NavItem[] = [
  { href: "/principal", label: "Dasbor" },
  { href: "/principal/classes", label: "Kelas" }
];

export default function PrincipalLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell navItems={principalNavItems} roleLabel="Kepala Sekolah" title="Dasbor Kepala Sekolah">
      {children}
    </AppShell>
  );
}
