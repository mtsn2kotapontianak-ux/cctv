import { ActionPanel } from "@/components/dashboard/action-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PrincipalDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "principal") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { count: classCount } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true });

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--primary)]">Kepala Sekolah</p>
        <h2 className="mt-2 text-2xl font-semibold">Pantau akses CCTV per kelas</h2>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Kelas" value={String(classCount ?? 0)} />
        <MetricCard label="Mode akses" value="Live" />
      </section>
      <ActionPanel
        description="Pilih kelas untuk membuka kamera yang sudah dipetakan oleh admin."
        href="/principal/classes"
        label="Buka daftar kelas"
        title="Daftar kelas"
      />
    </div>
  );
}
