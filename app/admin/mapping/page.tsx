import Link from "next/link";
import { updateClassMappingAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitButton } from "@/components/admin/submit-button";

type AdminMappingPageProps = {
  searchParams?: Promise<{
    classId?: string;
    status?: string;
    message?: string;
  }>;
};

type ClassRow = {
  id: string;
  nama_kelas: string;
};

type CameraRow = {
  id: string;
  nama_kamera: string;
  source_name: string;
  is_active: boolean;
};

type ParentRow = {
  id: string;
  nama: string;
};

type ClassCameraRow = {
  camera_id: string;
};

type UserClassRow = {
  user_id: string;
};

export default async function AdminMappingPage({ searchParams }: AdminMappingPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = createAdminClient();

  const [
    { data: classes, error: classesError },
    { data: cameras, error: camerasError },
    { data: parents, error: parentsError }
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("id,nama_kelas")
      .order("nama_kelas", { ascending: true })
      .returns<ClassRow[]>(),
    supabase
      .from("cameras")
      .select("id,nama_kamera,source_name,is_active")
      .order("nama_kamera", { ascending: true })
      .returns<CameraRow[]>(),
    supabase
      .from("profiles")
      .select("id,nama")
      .eq("role", "parent")
      .order("nama", { ascending: true })
      .returns<ParentRow[]>()
  ]);

  const activeClassId = classes?.some((c) => c.id === params?.classId)
    ? params!.classId!
    : classes?.[0]?.id ?? "";
  const selectedClass = classes?.find((classItem) => classItem.id === activeClassId);
  const loadError = classesError ?? camerasError ?? parentsError;

  const [
    { data: selectedCameraRows, error: selectedCamerasError },
    { data: selectedParentRows, error: selectedParentsError }
  ] = activeClassId
    ? await Promise.all([
        supabase
          .from("class_cameras")
          .select("camera_id")
          .eq("class_id", activeClassId)
          .returns<ClassCameraRow[]>(),
        supabase
          .from("user_classes")
          .select("user_id")
          .eq("class_id", activeClassId)
          .returns<UserClassRow[]>()
      ])
    : [
        { data: [] as ClassCameraRow[], error: null },
        { data: [] as UserClassRow[], error: null }
      ];

  const selectedCameraIds = new Set(selectedCameraRows?.map((row) => row.camera_id) ?? []);
  const selectedParentIds = new Set(selectedParentRows?.map((row) => row.user_id) ?? []);
  const relationError = selectedCamerasError ?? selectedParentsError;
  const status = params?.status === "success" || params?.status === "error" ? params.status : null;

  const mappingKey = `${activeClassId}-${Array.from(selectedCameraIds).sort().join(",")}-${Array.from(selectedParentIds).sort().join(",")}`;

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Pilih kelas</h2>
        {classes && classes.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {classes.map((classItem) => (
              <Link
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  classItem.id === activeClassId
                    ? "border-[var(--primary)] bg-[#e6f4f1] text-[var(--primary-strong)] shadow-sm"
                    : "border-[var(--border)] bg-white hover:bg-[var(--surface-subtle)] text-slate-700"
                }`}
                href={`/admin/mapping?classId=${classItem.id}`}
                key={classItem.id}
              >
                {classItem.nama_kelas}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Belum ada kelas. Buat kelas terlebih dahulu dari menu Kelas.
          </p>
        )}
      </section>

      {status ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            status === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-[var(--danger)]"
          }`}
        >
          {params?.message}
        </div>
      ) : null}

      {loadError || relationError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          Gagal memuat mapping: {(loadError ?? relationError)?.message}
        </div>
      ) : null}

      {selectedClass ? (
        <form
          action={updateClassMappingAction}
          className="grid gap-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
          key={mappingKey}
        >
          <input name="class_id" type="hidden" value={selectedClass.id} />
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Kelas terpilih</p>
            <h2 className="mt-1 text-xl font-semibold">{selectedClass.nama_kelas}</h2>
          </div>

          <section className="grid gap-3">
            <div>
              <h3 className="font-semibold">Kamera kelas</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pilih satu atau lebih kamera yang boleh diakses untuk kelas ini.
              </p>
            </div>
            {cameras && cameras.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {cameras.map((camera) => {
                  const isChecked = selectedCameraIds.has(camera.id);
                  return (
                    <label
                      className={`flex min-h-20 gap-3 rounded-md border p-3 text-sm cursor-pointer transition ${
                        isChecked
                          ? "border-teal-500 bg-teal-50/40 text-slate-900"
                          : "border-[var(--border)] bg-white hover:border-slate-400"
                      }`}
                      key={`${activeClassId}-${camera.id}-${isChecked}`}
                    >
                      <input
                        className="mt-1"
                        defaultChecked={isChecked}
                        name="camera_ids"
                        type="checkbox"
                        value={camera.id}
                      />
                      <span>
                        <span className="block font-semibold">{camera.nama_kamera}</span>
                        <span className="mt-1 block text-[var(--muted)]">{camera.source_name}</span>
                        <span className="mt-1 block text-xs text-[var(--muted)]">
                          {camera.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                Belum ada kamera. Buat kamera terlebih dahulu dari menu Kamera.
              </p>
            )}
          </section>

          <section className="grid gap-3">
            <div>
              <h3 className="font-semibold">Orang tua kelas</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Parent yang dipilih akan langsung mendapatkan akses kamera kelas ini.
              </p>
            </div>
            {parents && parents.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {parents.map((parent) => {
                  const isChecked = selectedParentIds.has(parent.id);
                  return (
                    <label
                      className={`flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer transition ${
                        isChecked
                          ? "border-teal-500 bg-teal-50/40 text-slate-900 font-semibold"
                          : "border-[var(--border)] bg-white hover:border-slate-400 font-medium"
                      }`}
                      key={`${activeClassId}-${parent.id}-${isChecked}`}
                    >
                      <input
                        defaultChecked={isChecked}
                        name="parent_ids"
                        type="checkbox"
                        value={parent.id}
                      />
                      <span>{parent.nama}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                Belum ada user dengan role Orang Tua.
              </p>
            )}
          </section>

          <div className="flex justify-end">
            <SubmitButton pendingLabel="Menyimpan mapping...">Simpan mapping</SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
