import { AppShell, type NavItem } from "@/components/layout/app-shell";

const parentNavItems: NavItem[] = [
  { href: "/parent", label: "Dasbor" },
  { href: "/parent/cameras", label: "Kamera" }
];

export default function ParentLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell navItems={parentNavItems} roleLabel="Orang Tua" title="Dasbor Orang Tua">
      {children}
    </AppShell>
  );
}
