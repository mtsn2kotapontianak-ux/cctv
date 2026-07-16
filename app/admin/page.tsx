import { MetricCard } from "@/components/dashboard/metric-card";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Monitor,
  Users,
  Video,
  Layers,
  Network,
  ClipboardList,
  ShieldAlert,
  Server,
  ArrowRight
} from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const [
    { count: userCount },
    { count: classCount },
    { count: activeCameraCount },
    { count: mappingCount }
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("cameras").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("class_cameras").select("class_id", { count: "exact", head: true })
  ]);

  const modules = [
    {
      title: "Monitoring NVR & Snapshot",
      description: "Pantau seluruh kamera CCTV secara serentak dalam grid NVR 2x2, 3x3, atau 4x4 beserta fitur live WebRTC.",
      href: "/admin/monitoring",
      icon: Monitor,
      color: "bg-teal-500/10 text-teal-600 border-teal-200",
      badge: `${activeCameraCount ?? 0} Kamera Aktif`
    },
    {
      title: "Manajemen Pengguna",
      description: "Kelola akun Admin, Kepala Sekolah, dan Orang Tua/Wali Murid beserta status aktivasi dan hak akses.",
      href: "/admin/users",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      badge: `${userCount ?? 0} Akun`
    },
    {
      title: "Konfigurasi Kamera & Go2RTC",
      description: "Daftarkan source RTSP/WebRTC kamera baru, atur URL tunnel Go2RTC, dan sesuaikan deskripsi kamera.",
      href: "/admin/cameras",
      icon: Video,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      badge: "Manajemen Stream"
    },
    {
      title: "Data Ruang Kelas",
      description: "Kelola daftar ruang kelas di MTsN 2 Pontianak yang akan dipetakan dengan kamera pemantau.",
      href: "/admin/classes",
      icon: Layers,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
      badge: `${classCount ?? 0} Ruang Kelas`
    },
    {
      title: "Pemetaan Kamera ke Kelas",
      description: "Atur izin kamera mana saja yang dapat dilihat dan dipantau oleh setiap kelas atau akun orang tua.",
      href: "/admin/mapping",
      icon: Network,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      badge: `${mappingCount ?? 0} Relasi`
    },
    {
      title: "Audit Log & Keamanan",
      description: "Lacak riwayat login, pembukaan stream CCTV, dan audit keamanan sistem oleh seluruh pengguna.",
      href: "/admin/logs",
      icon: ClipboardList,
      color: "bg-rose-500/10 text-rose-600 border-rose-200",
      badge: "Keamanan Aktif"
    }
  ];

  return (
    <div className="grid gap-6">
      {/* Executive Admin Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
              <Server size={14} />
              Administrator Control Center • MTsN 2 Pontianak
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sistem Operasional CCTV Digital Swanda
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Anda memiliki kontrol penuh atas infrastruktur kamera Go2RTC, pemetaan otorisasi kelas, serta pengawasan keamanan sistem untuk seluruh civitas sekolah.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/monitoring"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-teal-400 transition duration-200 transform hover:-translate-y-0.5"
            >
              <Monitor size={18} />
              Live Monitoring NVR
            </Link>
          </div>
        </div>
      </section>

      {/* Key Stats Metric Tiles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Pengguna Terdaftar" value={`${userCount ?? 0} Akun`} />
        <MetricCard label="Total Ruang Kelas" value={`${classCount ?? 0} Kelas`} />
        <MetricCard label="Kamera CCTV Aktif" value={`${activeCameraCount ?? 0} Unit`} />
        <MetricCard label="Status Server Go2RTC" value="🟢 Online / Lancar" />
      </section>

      {/* Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Modul Manajemen & Operasional</h2>
            <p className="text-sm text-[var(--muted)]">Pilih menu di bawah untuk mengonfigurasi dan memantau sistem.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition duration-200 hover:border-blue-500 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`grid h-12 w-12 place-items-center rounded-xl border ${mod.color}`}>
                      <Icon size={24} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {mod.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold text-blue-600 group-hover:text-blue-700">
                  <span>Buka Modul</span>
                  <ArrowRight size={16} className="transform transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
