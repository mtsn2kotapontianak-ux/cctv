import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/session";
import { logActivity } from "@/lib/logs/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrincipalNvrMonitoring, type PrincipalNvrCamera } from "@/components/cameras/principal-nvr-monitoring";

type CameraRow = {
  id: string;
  nama_kamera: string;
  source_name: string;
  snapshot_source_name: string | null;
  tunnel_url: string;
  snapshot_url: string | null;
  deskripsi: string | null;
  is_active: boolean;
};

type ClassRow = {
  id: string;
  nama_kelas: string;
};

type ClassCameraRow = {
  class_id: string;
  camera_id: string;
};

export default async function AdminMonitoringPage() {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const [
    { data: cameras, error: camerasError },
    { data: classes },
    { data: mappings }
  ] = await Promise.all([
    supabase
      .from("cameras")
      .select("id,nama_kamera,source_name,snapshot_source_name,tunnel_url,snapshot_url,deskripsi,is_active")
      .eq("is_active", true)
      .order("nama_kamera", { ascending: true })
      .returns<CameraRow[]>(),
    supabase.from("classes").select("id,nama_kelas").returns<ClassRow[]>(),
    supabase.from("class_cameras").select("class_id,camera_id").returns<ClassCameraRow[]>()
  ]);

  if (camerasError) {
    return (
      <EmptyState
        description={`Gagal memuat data kamera: ${camerasError.message}`}
        title="Monitoring tidak tersedia"
      />
    );
  }

  if (!cameras || cameras.length === 0) {
    return (
      <EmptyState
        description="Belum ada kamera aktif untuk ditampilkan."
        title="Tidak ada kamera aktif"
      />
    );
  }

  const classById = new Map((classes ?? []).map((c) => [c.id, c.nama_kelas]));
  const classNamesByCameraId = new Map<string, string[]>();

  (mappings ?? []).forEach((m) => {
    const className = classById.get(m.class_id);
    if (className) {
      const list = classNamesByCameraId.get(m.camera_id) ?? [];
      list.push(className);
      classNamesByCameraId.set(m.camera_id, list);
    }
  });

  const camerasWithClasses: PrincipalNvrCamera[] = cameras.map((cam) => ({
    ...cam,
    class_names: classNamesByCameraId.get(cam.id) ?? []
  }));

  await logActivity(supabase, {
    action: "admin.view_nvr_monitoring",
    metadata: {
      total_cameras: camerasWithClasses.length
    },
    userId: admin.id
  });

  return (
    <div className="grid gap-6">
      <PrincipalNvrMonitoring cameras={camerasWithClasses} />
    </div>
  );
}
