import {
  activateUserAction,
  createUserAction,
  deleteUserAction,
  updateUserAction,
  updateUserPasswordAction
} from "@/lib/admin/actions";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/datetime/format";
import { SubmitButton } from "@/components/admin/submit-button";

type ProfileRow = {
  id: string;
  is_active: boolean;
  nama: string;
  role: "admin" | "principal" | "parent";
  created_at: string;
  email: string;
};

type AdminUsersPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    role?: string;
    status?: string;
  }>;
};

const USERS_PER_PAGE = 10;

const roleLabels: Record<ProfileRow["role"], string> = {
  admin: "Admin",
  parent: "Orang Tua",
  principal: "Kepala Sekolah"
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildUsersHref({
  page,
  q,
  role,
  status
}: {
  page: number;
  q: string;
  role: ProfileRow["role"] | "all";
  status: "active" | "inactive" | "all";
}) {
  const query = new URLSearchParams();

  if (q) {
    query.set("q", q);
  }

  if (role !== "all") {
    query.set("role", role);
  }

  if (status !== "active") {
    query.set("status", status);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const value = query.toString();
  return value ? `/admin/users?${value}` : "/admin/users";
}

function RoleSelect({ defaultValue, form }: { defaultValue?: ProfileRow["role"]; form?: string }) {
  return (
    <select
      className="focus-ring w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
      defaultValue={defaultValue ?? "parent"}
      form={form}
      name="role"
    >
      <option value="admin">Admin</option>
      <option value="principal">Kepala Sekolah</option>
      <option value="parent">Orang Tua</option>
    </select>
  );
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const rawSearchQuery = String(params?.q ?? "").trim();
  const searchQuery = normalize(rawSearchQuery);
  const requestedPage = Number(params?.page ?? "1");
  const roleFilter = params?.role && ["admin", "principal", "parent"].includes(params.role)
    ? (params.role as ProfileRow["role"])
    : "all";
  const statusFilter = params?.status && ["active", "inactive", "all"].includes(params.status)
    ? (params.status as "active" | "inactive" | "all")
    : "active";

  const supabase = createAdminClient();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,is_active,nama,role,created_at")
    .order("created_at", { ascending: false })
    .returns<Omit<ProfileRow, "email">[]>();
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const emailById = new Map(usersData?.users.map((user) => [user.id, user.email ?? "-"]) ?? []);
  const data: ProfileRow[] =
    profiles?.map((profile) => ({
      ...profile,
      email: emailById.get(profile.id) ?? "-"
    })) ?? [];
  const filteredData = data.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      normalize(user.nama).includes(searchQuery) ||
      normalize(user.email).includes(searchQuery);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? user.is_active : !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredData.length / USERS_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, Math.floor(requestedPage)), totalPages)
    : 1;
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + USERS_PER_PAGE);
  const endIndex = Math.min(startIndex + paginatedData.length, filteredData.length);
  const error = profilesError ?? usersError;

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Tambah pengguna</h2>
        <form action={createUserAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_180px_auto]">
          <input
            className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
            name="nama"
            placeholder="Nama pengguna"
            required
          />
          <input
            className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
            name="email"
            placeholder="email@sekolah.sch.id"
            required
            type="email"
          />
          <input
            className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
            minLength={6}
            name="password"
            placeholder="Password awal"
            required
            type="password"
          />
          <RoleSelect />
          <SubmitButton pendingLabel="Membuat...">Tambah</SubmitButton>
        </form>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Daftar pengguna</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {filteredData.length === 0
                  ? `${filteredData.length} dari ${data.length} pengguna ditampilkan.`
                  : `Menampilkan ${startIndex + 1}-${endIndex} dari ${filteredData.length} pengguna.`}
              </p>
            </div>
            <form className="grid w-full gap-2 sm:w-auto sm:grid-cols-[240px_160px_150px_auto]" method="get">
              <input
                className="focus-ring rounded-md border border-[var(--border)] px-3 py-2 text-sm"
                defaultValue={params?.q ?? ""}
                name="q"
                placeholder="Cari nama atau email"
                type="search"
              />
              <input name="page" type="hidden" value="1" />
              <select
                className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
                defaultValue={roleFilter}
                name="role"
              >
                <option value="all">Semua role</option>
                <option value="admin">Admin</option>
                <option value="principal">Kepala Sekolah</option>
                <option value="parent">Orang Tua</option>
              </select>
              <select
                className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
                <option value="all">Semua status</option>
              </select>
              <button
                className="btn-primary focus-ring rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-strong)]"
                type="submit"
              >
                Terapkan
              </button>
            </form>
          </div>
        </div>
        {error ? (
          <div className="p-5 text-sm text-[var(--danger)]">Gagal memuat pengguna: {error.message}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">Belum ada pengguna.</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            Tidak ada pengguna yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-[var(--surface-subtle)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Dibuat</th>
                  <th className="px-4 py-3 font-semibold">Password</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginatedData.map((user) => {
                  const editFormId = `edit-user-${user.id}`;

                  return (
                    <tr className="align-top hover:bg-[var(--surface-subtle)]/60" key={user.id}>
                      <td className="px-4 py-3">
                        <form action={updateUserAction} id={editFormId}>
                          <input name="id" type="hidden" value={user.id} />
                        </form>
                        <input
                          className="focus-ring w-full min-w-44 rounded-md border border-[var(--border)] bg-white px-3 py-2"
                          defaultValue={user.nama}
                          form={editFormId}
                          name="nama"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-56 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-[var(--muted)]">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid gap-2">
                          <RoleSelect defaultValue={user.role} form={editFormId} />
                          <span className="inline-flex w-fit rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                            {roleLabels[user.role]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${
                            user.is_active
                              ? "bg-green-50 text-green-700 ring-green-100"
                              : "bg-red-50 text-red-700 ring-red-100"
                          }`}
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <form action={updateUserPasswordAction} className="flex min-w-72 gap-2">
                          <input name="id" type="hidden" value={user.id} />
                          <input
                            className="focus-ring w-full rounded-md border border-[var(--border)] px-3 py-2"
                            minLength={6}
                            name="password"
                            placeholder="Password baru"
                            required
                            type="password"
                          />
                          <SubmitButton pendingLabel="Mengubah..." variant="secondary">
                            Ubah
                          </SubmitButton>
                        </form>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <SubmitButton form={editFormId} pendingLabel="Menyimpan..." variant="secondary">
                            Simpan
                          </SubmitButton>
                          {user.is_active ? (
                            <form action={deleteUserAction}>
                              <input name="id" type="hidden" value={user.id} />
                              <SubmitButton pendingLabel="Menonaktifkan..." variant="danger">
                                Nonaktifkan
                              </SubmitButton>
                            </form>
                          ) : (
                            <form action={activateUserAction}>
                              <input name="id" type="hidden" value={user.id} />
                              <SubmitButton pendingLabel="Mengaktifkan..." variant="secondary">
                                Aktifkan
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-4">
              <p className="text-sm text-[var(--muted)]">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link
                    className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[var(--surface-subtle)]"
                    href={buildUsersHref({
                      page: currentPage - 1,
                      q: rawSearchQuery,
                      role: roleFilter,
                      status: statusFilter
                    })}
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
                    href={buildUsersHref({
                      page: currentPage + 1,
                      q: rawSearchQuery,
                      role: roleFilter,
                      status: statusFilter
                    })}
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
