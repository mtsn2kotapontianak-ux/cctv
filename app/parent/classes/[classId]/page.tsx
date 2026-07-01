import { EmptyState } from "@/components/ui/empty-state";
import { LiveCameraPlayer } from "@/components/cameras/live-camera-player";
import { getClassLiveView } from "@/lib/cameras/class-live";

type ParentClassDetailPageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function ParentClassDetailPage({ params }: ParentClassDetailPageProps) {
  const { classId } = await params;
  const { cameras, classItem } = await getClassLiveView(classId, "parent");

  if (!classItem) {
    return (
      <EmptyState
        description="Kelas tidak ditemukan atau akun Anda tidak memiliki akses ke kelas ini."
        title="Akses kelas tidak tersedia"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-medium text-[var(--muted)]">Live view kelas</p>
        <h2 className="mt-1 text-2xl font-semibold">{classItem.nama_kelas}</h2>
      </section>
      {cameras.length === 0 ? (
        <EmptyState
          description="Belum ada kamera aktif yang tersedia untuk kelas ini."
          title="Tidak ada kamera"
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {cameras.map((camera) => (
            <LiveCameraPlayer camera={camera} key={camera.id} />
          ))}
        </section>
      )}
    </div>
  );
}
