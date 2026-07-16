import { EmptyState } from "@/components/ui/empty-state";
import { ParentSnapshotGrid } from "@/components/cameras/parent-snapshot-grid";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Camera, GraduationCap, ShieldCheck } from "lucide-react";
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

export default async function ParentCamerasPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "parent") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data: mappings, error: mappingError } = await supabase
    .from("class_cameras")
    .select("class_id,camera_id")
    .returns<ClassCameraRow[]>();

  if (mappingError) {
    return (
      <EmptyState
        description={`Gagal memuat mapping kamera: ${mappingError.message}`}
        title="Kamera tidak tersedia"
      />
    );
  }

  const cameraIds = [...new Set((mappings ?? []).map((mapping) => mapping.camera_id))];
  const classIds = [...new Set((mappings ?? []).map((mapping) => mapping.class_id))];

  const [
    { data, error },
    { data: classes }
  ] = await Promise.all([
    cameraIds.length > 0
      ? supabase
          .from("cameras")
          .select("id,nama_kamera,source_name,snapshot_source_name,tunnel_url,snapshot_url,deskripsi")
          .in("id", cameraIds)
          .eq("is_active", true)
          .order("nama_kamera", { ascending: true })
          .returns<CameraRow[]>()
      : Promise.resolve({ data: [] as CameraRow[], error: null }),
    classIds.length > 0
      ? supabase
          .from("classes")
          .select("id,nama_kelas")
          .in("id", classIds)
          .order("nama_kelas", { ascending: true })
          .returns<ClassRow[]>()
      : Promise.resolve({ data: [] as ClassRow[] })
  ]);

  if (error) {
    return (
      <EmptyState
        description={`Gagal memuat kamera: ${error.message}`}
        title="Kamera tidak tersedia"
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        description="Belum ada kamera yang diizinkan untuk akun ini."
        title="Tidak ada kamera"
      />
    );
  }

  const classIdsByCameraId = new Map<string, string[]>();
  const classNamesById = new Map((classes ?? []).map((classItem) => [classItem.id, classItem.nama_kelas]));

  (mappings ?? []).forEach((mapping) => {
    classIdsByCameraId.set(mapping.camera_id, [
      ...(classIdsByCameraId.get(mapping.camera_id) ?? []),
      mapping.class_id
    ]);
  });

  return (
    <div className="grid gap-6">
      {/* Executive Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 ring-1 ring-teal-500/30">
            <ShieldCheck size={14} />
            Daftar Kamera Terautorisasi • Orang Tua
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Kamera Ruang Kelas Anak ({data.length} Unit)
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Berikut adalah daftar kamera CCTV yang telah dipetakan khusus oleh sekolah untuk ruang kelas anak Anda. Klik tombol &ldquo;Buka Live&rdquo; untuk menonton video bergerak.
          </p>
        </div>
      </section>

      {/* Reassuring Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Kamera Terotorisasi" value={`${data.length} Kamera`} />
        <MetricCard label="Ruang Kelas Terhubung" value={`${classes?.length ?? 0} Ruangan`} />
        <MetricCard label="Status Keamanan Akses" value="🟢 Terproteksi Penuh" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Snapshot & Jalan Pintas Live View</h2>
            <p className="text-sm text-[var(--muted)]">Pratinjau gambar diperbarui otomatis setiap 15 detik agar hemat bandwidth.</p>
          </div>
        </div>
        <ParentSnapshotGrid
          cameras={data.map((camera) => ({
            ...camera,
            class_ids: classIdsByCameraId.get(camera.id) ?? [],
            class_names: (classIdsByCameraId.get(camera.id) ?? [])
              .map((classId) => classNamesById.get(classId))
              .filter((className): className is string => Boolean(className))
          }))}
        />
      </section>
    </div>
  );
}
