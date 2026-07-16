import { ActionPanel } from "@/components/dashboard/action-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Monitor, ShieldCheck, Layers, Video } from "lucide-react";
import Link from "next/link";

export default async function PrincipalDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "principal") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const [
    { count: classCount },
    { count: activeCameraCount }
  ] = await Promise.all([
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("cameras").select("id", { count: "exact", head: true }).eq("is_active", true)
  ]);

  return (
    <div className="grid gap-6">
      {/* Executive Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 ring-1 ring-teal-500/30">
              <ShieldCheck size={14} />
              Akses Eksekutif Kepala Sekolah • MTsN 2 Pontianak
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat datang, {profile.nama}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Sebagai Kepala Sekolah, Anda memiliki hak penuh untuk memantau seluruh kamera CCTV yang telah dikonfigurasi secara real-time, baik melalui tampilan grid NVR komprehensif maupun pemetaan per kelas.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/principal/monitoring"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-teal-400 transition duration-200 transform hover:-translate-y-0.5"
            >
              <Monitor size={18} />
              Buka Live NVR Semua Kamera
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Kamera Aktif" value={`${activeCameraCount ?? 0} CH`} />
        <MetricCard label="Total Kelas Terpantau" value={`${classCount ?? 0} Ruang`} />
        <MetricCard label="Hak Akses Akun" value="Semua Kamera" />
        <MetricCard label="Status Sistem NVR" value="🟢 Normal / Online" />
      </section>

      {/* Action Navigation Panels */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Monitor size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Monitoring NVR (Semua Kamera)</h3>
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              Tampilkan seluruh kamera CCTV di sekolah dalam format grid NVR 2x2, 3x3, atau 4x4. Tersedia mode hemat bandwidth (snapshot otomatis) dan mode live WebRTC full screen.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <Link
              href="/principal/monitoring"
              className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800 transition"
            >
              Buka Command Center NVR →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Layers size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Monitoring Berdasarkan Kelas</h3>
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              Pilih dan fokus pada ruang kelas tertentu (misal Kelas 7A, 8B, 9C) untuk melihat live view khusus kamera yang terpasang di ruang kelas tersebut.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <Link
              href="/principal/classes"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800 transition"
            >
              Buka Daftar Ruang Kelas →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
