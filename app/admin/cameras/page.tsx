import {
  createCameraAction,
  deleteCameraAction,
  updateCameraAction
} from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitButton } from "@/components/admin/submit-button";

type CameraRow = {
  id: string;
  nama_kamera: string;
  snapshot_source_name: string | null;
  source_name: string;
  tunnel_url: string;
  snapshot_url: string | null;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
};

type AdminCamerasPageProps = {
  searchParams?: Promise<{
    message?: string;
    status?: string;
  }>;
};

function CameraFields({ camera }: { camera?: CameraRow }) {
  return (
    <>
      <input
        className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
        defaultValue={camera?.nama_kamera}
        name="nama_kamera"
        placeholder="Nama kamera"
        required
      />
      <input
        className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
        defaultValue={camera?.source_name}
        name="source_name"
        placeholder="Source live go2rtc, contoh: kamera_tes"
        required
      />
      <input
        className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
        defaultValue={camera?.snapshot_source_name ?? ""}
        name="snapshot_source_name"
        placeholder="Source snapshot opsional, contoh: kamera_tes_snapshot"
      />
      <input
        className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
        defaultValue={camera?.tunnel_url}
        name="tunnel_url"
        inputMode="url"
        placeholder="https://domain-tunnel/stream.html?src=nama_source"
        required
      />
      <input
        className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
        defaultValue={camera?.snapshot_url ?? ""}
        name="snapshot_url"
        inputMode="url"
        placeholder="Opsional jika ingin override URL snapshot penuh"
      />
      <textarea
        className="focus-ring min-h-20 rounded-md border border-[var(--border)] px-3 py-2 lg:col-span-2"
        defaultValue={camera?.deskripsi ?? ""}
        name="deskripsi"
        placeholder="Deskripsi"
      />
      <label className="flex items-center gap-2 text-sm font-medium">
        <input defaultChecked={camera?.is_active ?? true} name="is_active" type="checkbox" />
        Aktif
      </label>
    </>
  );
}

export default async function AdminCamerasPage({ searchParams }: AdminCamerasPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cameras")
    .select("id,nama_kamera,source_name,snapshot_source_name,tunnel_url,snapshot_url,deskripsi,is_active,created_at")
    .order("created_at", { ascending: false })
    .returns<CameraRow[]>();

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Tambah kamera</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Alamat kamera boleh ditulis dengan atau tanpa <code>https://</code>. Sistem akan
          menambahkan <code>https://</code> otomatis saat disimpan.
        </p>
        <form action={createCameraAction} className="mt-4 grid gap-3 lg:grid-cols-2">
          <CameraFields />
          <div className="lg:col-span-2">
            <SubmitButton pendingLabel="Membuat...">Tambah</SubmitButton>
          </div>
        </form>
      </section>

      {params?.message ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            params.status === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-[var(--danger)]"
          }`}
        >
          {params.message}
        </div>
      ) : null}

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="text-lg font-semibold">Daftar kamera</h2>
        </div>
        {error ? (
          <div className="p-5 text-sm text-[var(--danger)]">Gagal memuat kamera: {error.message}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">Belum ada kamera.</div>
        ) : (
          <div className="grid gap-4 p-4">
            {data.map((camera) => (
              <article
                className="rounded-lg border border-[var(--border)] bg-white p-4"
                key={camera.id}
              >
                <form action={updateCameraAction} className="grid gap-3 lg:grid-cols-2">
                  <input name="id" type="hidden" value={camera.id} />
                  <CameraFields camera={camera} />
                  <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
                    <SubmitButton pendingLabel="Menyimpan..." variant="secondary">
                      Simpan
                    </SubmitButton>
                    <span className="text-sm text-[var(--muted)]">
                      Dibuat {new Date(camera.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </form>
                <form action={deleteCameraAction} className="mt-3">
                  <input name="id" type="hidden" value={camera.id} />
                  <SubmitButton pendingLabel="Menghapus..." variant="danger">
                    Hapus
                  </SubmitButton>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
