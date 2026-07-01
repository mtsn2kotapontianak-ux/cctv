import { EmptyState } from "@/components/ui/empty-state";
import { ParentSnapshotGrid } from "@/components/cameras/parent-snapshot-grid";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Camera, GraduationCap, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

type MetricTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "teal" | "amber" | "slate";
};

function MetricTile({ icon: Icon, label, value, tone }: MetricTileProps) {
  const toneClassName = {
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200"
  }[tone];

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ring-1 ${toneClassName}`}>
        <Icon aria-hidden="true" size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-normal">{value}</p>
      </div>
    </div>
  );
}

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
      <div className="mx-auto max-w-6xl">
        <EmptyState
          description={`Gagal memuat mapping kamera: ${mappingError.message}`}
          title="Kamera tidak tersedia"
        />
      </div>
    );
  }

  const cameraIds = [...new Set((mappings ?? []).map((mapping) => mapping.camera_id))];
  const classIds = [...new Set((mappings ?? []).map((mapping) => mapping.class_id))];
  const { data, error } =
    cameraIds.length > 0
      ? await supabase
          .from("cameras")
          .select("id,nama_kamera,source_name,snapshot_source_name,tunnel_url,snapshot_url,deskripsi")
          .in("id", cameraIds)
          .eq("is_active", true)
          .order("nama_kamera", { ascending: true })
          .returns<CameraRow[]>()
      : { data: [] as CameraRow[], error: null };
  const { data: classes } =
    classIds.length > 0
      ? await supabase
          .from("classes")
          .select("id,nama_kelas")
          .in("id", classIds)
          .order("nama_kelas", { ascending: true })
          .returns<ClassRow[]>()
      : { data: [] as ClassRow[] };

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState
          description={`Gagal memuat kamera: ${error.message}`}
          title="Kamera tidak tersedia"
        />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState
          description="Belum ada kamera yang diizinkan untuk akun ini."
          title="Tidak ada kamera"
        />
      </div>
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
    <div className="mx-auto grid max-w-6xl gap-5">
      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="px-5 py-6 lg:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
              <ShieldCheck aria-hidden="true" size={16} />
              Kamera terotorisasi
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal lg:text-3xl">
              Kamera yang diizinkan
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Snapshot ringan ditampilkan sebagai pratinjau sebelum membuka live view kelas.
            </p>
          </div>
        </div>
        <div className="grid divide-y divide-[var(--border)] border-t border-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricTile icon={Camera} label="Total kamera" tone="amber" value={String(data.length)} />
          <MetricTile
            icon={GraduationCap}
            label="Kelas terhubung"
            tone="teal"
            value={String(classes?.length ?? 0)}
          />
          <MetricTile icon={ShieldCheck} label="Status akses" tone="slate" value="Aman" />
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Snapshot kamera</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Buka live view dari kamera yang sudah dipetakan ke kelas anak.
          </p>
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
