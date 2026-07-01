import {
  addParentToClassAction,
  createClassAction,
  deleteClassAction,
  importClassParentsJsonAction,
  removeParentFromClassAction,
  updateClassAction
} from "@/lib/admin/actions";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/datetime/format";
import { SubmitButton } from "@/components/admin/submit-button";

type AdminClassesPageProps = {
  searchParams?: Promise<{
    message?: string;
    page?: string;
    status?: string;
  }>;
};

type ClassRow = {
  id: string;
  nama_kelas: string;
  created_at: string;
};

type ParentRow = {
  id: string;
  nama: string;
};

type UserClassRow = {
  class_id: string;
  user_id: string;
};

const CLASSES_PER_PAGE = 5;

const parentJsonTemplate = JSON.stringify(
  {
    users: [
      {
        nama: "Nama Orang Tua",
        email: "orangtua@example.com",
        password: "Password123",
        role: "parent"
      }
    ]
  },
  null,
  2
);

function buildClassesHref(page: number) {
  return page > 1 ? `/admin/classes?page=${page}` : "/admin/classes";
}

export default async function AdminClassesPage({ searchParams }: AdminClassesPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const requestedPage = Number(params?.page ?? "1");
  const supabase = createAdminClient();
  const [
    { data: classes, error: classesError },
    { data: parents, error: parentsError },
    { data: userClasses, error: userClassesError }
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("id,nama_kelas,created_at")
      .order("nama_kelas", { ascending: true })
      .returns<ClassRow[]>(),
    supabase
      .from("profiles")
      .select("id,nama")
      .eq("role", "parent")
      .order("nama", { ascending: true })
      .returns<ParentRow[]>(),
    supabase.from("user_classes").select("class_id,user_id").returns<UserClassRow[]>()
  ]);
  const error = classesError ?? parentsError ?? userClassesError;
  const parentById = new Map((parents ?? []).map((parent) => [parent.id, parent]));
  const totalClasses = classes?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalClasses / CLASSES_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, Math.floor(requestedPage)), totalPages)
    : 1;
  const startIndex = (currentPage - 1) * CLASSES_PER_PAGE;
  const paginatedClasses = (classes ?? []).slice(startIndex, startIndex + CLASSES_PER_PAGE);
  const endIndex = Math.min(startIndex + paginatedClasses.length, totalClasses);

  function getClassParents(classId: string) {
    return (userClasses ?? [])
      .filter((row) => row.class_id === classId)
      .map((row) => parentById.get(row.user_id))
      .filter((parent): parent is ParentRow => Boolean(parent));
  }

  function getAvailableParents(classId: string) {
    const assignedIds = new Set(
      (userClasses ?? []).filter((row) => row.class_id === classId).map((row) => row.user_id)
    );

    return (parents ?? []).filter((parent) => !assignedIds.has(parent.id));
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Tambah kelas</h2>
        <form action={createClassAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
            name="nama_kelas"
            placeholder="Contoh: Kelas 7A"
            required
          />
          <SubmitButton pendingLabel="Membuat...">Tambah</SubmitButton>
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
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] p-5">
          <div>
            <h2 className="text-lg font-semibold">Daftar kelas</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {totalClasses === 0
                ? "Belum ada kelas yang ditampilkan."
                : `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalClasses} kelas.`}
            </p>
          </div>
          {totalClasses > 0 ? (
            <span className="rounded-md bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 ring-1 ring-teal-100">
              {parents?.length ?? 0} parent tersedia
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="p-5 text-sm text-[var(--danger)]">Gagal memuat kelas: {error.message}</div>
        ) : !classes || classes.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">Belum ada kelas.</div>
        ) : (
          <div>
            <div className="divide-y divide-[var(--border)]">
              {paginatedClasses.map((classItem, index) => {
                const assignedParents = getClassParents(classItem.id);
                const availableParents = getAvailableParents(classItem.id);

                return (
                  <details
                    className="group bg-white open:bg-[var(--surface)]"
                    key={classItem.id}
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--surface-subtle)]">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{classItem.nama_kelas}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {assignedParents.length} orang tua - Dibuat{" "}
                          {formatDate(classItem.created_at)}
                        </p>
                      </div>
                      <span className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 group-open:bg-teal-50 group-open:text-teal-700">
                        Detail
                      </span>
                    </summary>

                    <div className="grid gap-5 border-t border-[var(--border)] px-5 py-5">
                      <section className="grid gap-3 rounded-md border border-[var(--border)] bg-white p-4">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">Data kelas</h3>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              Ubah nama kelas atau hapus kelas jika sudah tidak digunakan.
                            </p>
                          </div>
                          <form action={deleteClassAction}>
                            <input name="id" type="hidden" value={classItem.id} />
                            <SubmitButton pendingLabel="Menghapus..." variant="danger">
                              Hapus kelas
                            </SubmitButton>
                          </form>
                        </div>
                        <form action={updateClassAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <input name="id" type="hidden" value={classItem.id} />
                          <input
                            className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
                            defaultValue={classItem.nama_kelas}
                            name="nama_kelas"
                            required
                          />
                          <SubmitButton pendingLabel="Menyimpan..." variant="secondary">
                            Simpan
                          </SubmitButton>
                        </form>
                      </section>

                      <section className="grid gap-3 rounded-md border border-[var(--border)] bg-white p-4">
                        <div>
                          <h3 className="font-semibold">Orang tua di kelas ini</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            User parent di bawah otomatis mendapat akses kamera yang dipetakan ke kelas.
                          </p>
                        </div>
                        {assignedParents.length === 0 ? (
                          <p className="rounded-md border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                            Belum ada orang tua di kelas ini.
                          </p>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {assignedParents.map((parent) => (
                              <div
                                className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] px-3 py-2"
                                key={parent.id}
                              >
                                <span className="text-sm font-medium">{parent.nama}</span>
                                <form action={removeParentFromClassAction}>
                                  <input name="class_id" type="hidden" value={classItem.id} />
                                  <input name="user_id" type="hidden" value={parent.id} />
                                  <SubmitButton pendingLabel="Menghapus..." variant="danger">
                                    Hapus
                                  </SubmitButton>
                                </form>
                              </div>
                            ))}
                          </div>
                        )}

                        <form action={addParentToClassAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                          <input name="class_id" type="hidden" value={classItem.id} />
                          <select
                            className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2"
                            disabled={availableParents.length === 0}
                            name="user_id"
                            required
                          >
                            <option value="">Pilih orang tua yang sudah ada</option>
                            {availableParents.map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.nama}
                              </option>
                            ))}
                          </select>
                          <SubmitButton pendingLabel="Menambahkan..." variant="secondary">
                            Tambahkan Manual
                          </SubmitButton>
                        </form>
                      </section>

                      <details className="rounded-md border border-[var(--border)] bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 font-semibold hover:bg-[var(--surface-subtle)]">
                          Import orang tua via JSON
                        </summary>
                        <form
                          action={importClassParentsJsonAction}
                          className="grid gap-3 border-t border-[var(--border)] p-4"
                        >
                          <input name="class_id" type="hidden" value={classItem.id} />
                          <label className="grid gap-2 text-sm font-medium">
                            Template JSON
                            <textarea
                              className="focus-ring min-h-44 rounded-md border border-[var(--border)] px-3 py-2 font-mono text-xs"
                              defaultValue={parentJsonTemplate}
                              name="users_json"
                              required
                            />
                          </label>
                          <div>
                            <SubmitButton pendingLabel="Mengimport...">Import JSON ke kelas</SubmitButton>
                          </div>
                        </form>
                      </details>
                    </div>
                  </details>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
              <p className="text-sm text-[var(--muted)]">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link
                    className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[var(--surface-subtle)]"
                    href={buildClassesHref(currentPage - 1)}
                  >
                    Sebelumnya
                  </Link>
                ) : (
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">
                    Sebelumnya
                  </span>
                )}
                {currentPage < totalPages ? (
                  <Link
                    className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[var(--surface-subtle)]"
                    href={buildClassesHref(currentPage + 1)}
                  >
                    Berikutnya
                  </Link>
                ) : (
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">
                    Berikutnya
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
