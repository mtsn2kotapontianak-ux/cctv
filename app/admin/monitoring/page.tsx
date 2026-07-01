import { EmptyState } from "@/components/ui/empty-state";
import {
  SnapshotMonitoringGrid,
  type SnapshotCamera
} from "@/components/cameras/snapshot-monitoring-grid";
import { requireAdmin } from "@/lib/auth/session";
import { logActivity } from "@/lib/logs/activity";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminMonitoringPage() {
  const admin = await requireAdmin();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cameras")
    .select("id,nama_kamera,source_name,snapshot_source_name,tunnel_url,snapshot_url,deskripsi")
    .eq("is_active", true)
    .order("nama_kamera", { ascending: true })
    .returns<SnapshotCamera[]>();

  if (error) {
    return (
      <EmptyState
        description={`Gagal memuat data kamera: ${error.message}`}
        title="Monitoring tidak tersedia"
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        description="Belum ada kamera aktif untuk ditampilkan."
        title="Tidak ada kamera aktif"
      />
    );
  }

  await Promise.all(
    data.map((camera) =>
      logActivity(supabase, {
        action: "camera.view_snapshot",
        cameraId: camera.id,
        metadata: {
          source_name: camera.source_name
        },
        userId: admin.id
      })
    )
  );

  return <SnapshotMonitoringGrid cameras={data} />;
}
