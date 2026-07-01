import Link from "next/link";
import { LiveCameraPlayer, type LiveCamera } from "@/components/cameras/live-camera-player";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/session";
import { logActivity } from "@/lib/logs/activity";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminCameraLivePageProps = {
  params: Promise<{
    cameraId: string;
  }>;
};

export default async function AdminCameraLivePage({ params }: AdminCameraLivePageProps) {
  const admin = await requireAdmin();
  const { cameraId } = await params;
  const supabase = createAdminClient();
  const { data: camera, error } = await supabase
    .from("cameras")
    .select("id,nama_kamera,source_name,tunnel_url,deskripsi,is_active")
    .eq("id", cameraId)
    .maybeSingle<LiveCamera>();

  if (error) {
    return (
      <EmptyState
        description={`Gagal memuat kamera: ${error.message}`}
        title="Kamera tidak tersedia"
      />
    );
  }

  if (!camera) {
    return <EmptyState description="Data kamera tidak ditemukan." title="Kamera tidak ditemukan" />;
  }

  await logActivity(supabase, {
    action: "camera.view_live",
    cameraId: camera.id,
    metadata: {
      role: admin.role,
      source_name: camera.source_name
    },
    userId: admin.id
  });

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">Live kamera admin</p>
          <h2 className="mt-1 text-2xl font-semibold">{camera.nama_kamera}</h2>
        </div>
        <Link
          className="focus-ring rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-subtle)]"
          href="/admin/monitoring"
        >
          Kembali ke monitoring
        </Link>
      </section>
      <LiveCameraPlayer camera={camera} />
    </div>
  );
}
