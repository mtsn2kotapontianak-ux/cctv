import type { Metadata } from "next";
import { RuntimeEventGuard } from "@/components/system/runtime-event-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "CCTV Digital Swanda",
  description: "Live CCTV Web Portal untuk sekolah dengan akses berbasis role."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <RuntimeEventGuard />
        {children}
      </body>
    </html>
  );
}
