import Link from "next/link";
import {
  Camera,
  GraduationCap,
  ShieldCheck,
  PlayCircle,
  ArrowRight,
  Eye,
  CheckCircle2
} from "lucide-react";
import { ParentSnapshotGrid } from "@/components/cameras/parent-snapshot-grid";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/metric-card";

type ClassRow = {
  id: string;
  nama_kelas: string;
};

type ClassCameraRow = {
  camera_id: string;
  class_id: string;
};

type CameraRow = {
  id: string;
  nama_kamera: string;
  source_name: string;
  snapshot_source_name: string | null;
  tunnel_url: string;
  snapshot_url: string | null;
  deskripsi: string | null;
};

export default async function ParentDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "parent") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const [
    { data: classes },
    { data: mappings }
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("id,nama_kelas")
      .order("nama_kelas", { ascending: true })
      .returns<ClassRow[]>(),
    supabase
      .from("class_cameras")
      .select("class_id,camera_id")
      .returns<ClassCameraRow[]>()
  ]);

  const cameraIds = [...new Set((mappings ?? []).map((mapping) => mapping.camera_id))];
  const { data: cameras } =
    cameraIds.length > 0
      ? await supabase
          .from("cameras")
          .select("id,nama_kamera,source_name,snapshot_source_name,tunnel_url,snapshot_url,deskripsi")
          .in("id", cameraIds)
          .eq("is_active", true)
          .order("nama_kamera", { ascending: true })
          .returns<CameraRow[]>()
      : { data: [] as CameraRow[] };

  const classIdsByCameraId = new Map<string, string[]>();
  const classNamesById = new Map((classes ?? []).map((classItem) => [classItem.id, classItem.nama_kelas]));
  const cameraCountByClassId = new Map<string, number>();

  (mappings ?? []).forEach((mapping) => {
    classIdsByCameraId.set(mapping.camera_id, [
      ...(classIdsByCameraId.get(mapping.camera_id) ?? []),
      mapping.class_id
    ]);
    cameraCountByClassId.set(mapping.class_id, (cameraCountByClassId.get(mapping.class_id) ?? 0) + 1);
  });

  const snapshotCameras = (cameras ?? []).map((camera) => ({
    ...camera,
    class_ids: classIdsByCameraId.get(camera.id) ?? [],
    class_names: (classIdsByCameraId.get(camera.id) ?? [])
      .map((classId) => classNamesById.get(classId))
      .filter((className): className is string => Boolean(className))
  }));

  const hasClasses = Boolean(classes?.length);

  return (
    <div className="grid gap-6">
      {/* Executive Parent Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 ring-1 ring-teal-500/30">
              <ShieldCheck size={14} />
              Portal Monitoring Orang Tua & Wali Murid • MTsN 2 Pontianak
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat datang, {profile.nama}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Pantau aktivitas kegiatan belajar anak Anda di ruang kelas melalui pratinjau snapshot ringan yang diperbarui otomatis, dan buka live stream WebRTC saat jam sekolah.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/parent/cameras"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-teal-400 transition duration-200 transform hover:-translate-y-0.5"
            >
              <Eye size={18} />
              Lihat Semua Kamera
            </Link>
          </div>
        </div>
      </section>

      {/* Reassuring Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Ruang Kelas Anak" value={`${classes?.length ?? 0} Kelas`} />
        <MetricCard label="Kamera Terautorisasi" value={`${snapshotCameras.length} Kamera`} />
        <MetricCard label="Enkripsi Stream" value="🔒 Go2RTC Aman" />
        <MetricCard label="Status Pemantauan" value="🟢 Aktif / Online" />
      </section>

      {/* Class shortcuts section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Daftar Ruang Kelas Anak</h2>
            <p className="text-sm text-[var(--muted)]">Klik pada kelas untuk masuk ke tampilan live video bergerak.</p>
          </div>
        </div>

        {!hasClasses ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Belum ada kelas yang dihubungkan dengan akun orang tua ini. Silakan hubungi admin sekolah jika ada kesalahan mapping.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(classes ?? []).map((classItem) => {
              const count = cameraCountByClassId.get(classItem.id) ?? 0;
              return (
                <Link
                  key={classItem.id}
                  href={`/parent/classes/${classItem.id}`}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition duration-200 hover:border-teal-500 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-200">
                        <GraduationCap size={20} />
                      </span>
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                        {count} Kamera Terpasang
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-teal-600 transition">
                      {classItem.nama_kelas}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Klik untuk menonton streaming video live real-time dari ruang kelas ini.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-teal-600 group-hover:text-teal-700">
                    <span className="flex items-center gap-1.5">
                      <PlayCircle size={15} />
                      Buka Live Stream
                    </span>
                    <ArrowRight size={14} className="transform transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Snapshot Preview Grid Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Pratinjau Snapshot Ruang Kelas</h2>
            <p className="text-sm text-[var(--muted)]">Pratinjau gambar diperbarui otomatis setiap 15 detik agar hemat kuota internet Anda.</p>
          </div>
        </div>

        {snapshotCameras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Belum ada kamera aktif yang dipetakan ke kelas anak Anda saat ini.
          </div>
        ) : (
          <ParentSnapshotGrid cameras={snapshotCameras} density="dashboard" />
        )}
      </section>
    </div>
  );
}
