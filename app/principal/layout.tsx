import { AppShell, type NavItem } from "@/components/layout/app-shell";

const principalNavItems: NavItem[] = [
  { href: "/principal", label: "Dasbor Komando" },
  { href: "/principal/monitoring", label: "Monitoring NVR (Semua Kamera)" },
  { href: "/principal/classes", label: "Daftar Per Kelas" }
];

export default function PrincipalLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell navItems={principalNavItems} roleLabel="Kepala Sekolah" title="Dasbor NVR & CCTV Kepala Sekolah">
      {children}
    </AppShell>
  );
}
