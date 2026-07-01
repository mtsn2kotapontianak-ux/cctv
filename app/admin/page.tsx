import { ActionPanel } from "@/components/dashboard/action-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = createAdminClient();
  const [
    { count: userCount },
    { count: classCount },
    { count: activeCameraCount }
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("cameras").select("id", { count: "exact", head: true }).eq("is_active", true)
  ]);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--primary)]">Ringkasan sistem</p>
        <h2 className="mt-2 text-2xl font-semibold">Operasional CCTV Digital Swanda</h2>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="User" value={String(userCount ?? 0)} />
        <MetricCard label="Kelas" value={String(classCount ?? 0)} />
        <MetricCard label="Kamera aktif" value={String(activeCameraCount ?? 0)} />
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          description="Pantau semua kamera aktif menggunakan frame JPEG berkala."
          href="/admin/monitoring"
          label="Buka monitoring"
          title="Monitoring snapshot"
        />
        <ActionPanel
          description="Audit login, akses kamera, dan perubahan data penting."
          href="/admin/logs"
          label="Lihat log"
          title="Activity logs"
        />
      </section>
    </div>
  );
}
