import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/datetime/format";
import type { ActivityAction } from "@/lib/logs/activity";

type AdminLogsPageProps = {
  searchParams?: Promise<{
    action?: string;
    cameraId?: string;
    date?: string;
    page?: string;
    userId?: string;
  }>;
};

type LogRow = {
  id: string;
  user_id: string | null;
  action: string;
  camera_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nama: string;
  role: string;
};

type CameraRow = {
  id: string;
  nama_kamera: string;
};

const actions: ActivityAction[] = [
  "auth.login",
  "auth.logout",
  "camera.view_live",
  "camera.view_snapshot",
  "class.open",
  "admin.user.create",
  "admin.user.update",
  "admin.camera.create",
  "admin.camera.update",
  "admin.mapping.update"
];

const pageSize = 25;

function buildPageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/admin/logs?${next.toString()}`;
}

export default async function AdminLogsPage({ searchParams }: AdminLogsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const currentPage = Math.max(Number(params?.page ?? "1") || 1, 1);
  const selectedAction = params?.action ?? "";
  const selectedCameraId = params?.cameraId ?? "";
  const selectedDate = params?.date ?? "";
  const selectedUserId = params?.userId ?? "";
  const queryParams = new URLSearchParams();

  if (selectedAction) queryParams.set("action", selectedAction);
  if (selectedCameraId) queryParams.set("cameraId", selectedCameraId);
  if (selectedDate) queryParams.set("date", selectedDate);
  if (selectedUserId) queryParams.set("userId", selectedUserId);

  const supabase = createAdminClient();
  let logsQuery = supabase
    .from("activity_logs")
    .select("id,user_id,action,camera_id,metadata,created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (selectedAction) {
    logsQuery = logsQuery.eq("action", selectedAction);
  }

  if (selectedCameraId) {
    logsQuery = logsQuery.eq("camera_id", selectedCameraId);
  }

  if (selectedUserId) {
    logsQuery = logsQuery.eq("user_id", selectedUserId);
  }

  if (selectedDate) {
    logsQuery = logsQuery
      .gte("created_at", `${selectedDate}T00:00:00.000+07:00`)
      .lt("created_at", `${selectedDate}T23:59:59.999+07:00`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const [
    { data: profiles },
    { data: cameras },
    { count, data: logs, error }
  ] = await Promise.all([
    supabase.from("profiles").select("id,nama,role").order("nama").returns<ProfileRow[]>(),
    supabase.from("cameras").select("id,nama_kamera").order("nama_kamera").returns<CameraRow[]>(),
    logsQuery.range(from, to).returns<LogRow[]>()
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const cameraById = new Map((cameras ?? []).map((camera) => [camera.id, camera]));
  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Filter log</h2>
        <form className="mt-4 grid gap-3 lg:grid-cols-5">
          <select
            className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2"
            defaultValue={selectedUserId}
            name="userId"
          >
            <option value="">Semua user</option>
            {(profiles ?? []).map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.nama} ({profile.role})
              </option>
            ))}
          </select>
          <select
            className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2"
            defaultValue={selectedAction}
            name="action"
          >
            <option value="">Semua action</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            className="focus-ring rounded-md border border-[var(--border)] bg-white px-3 py-2"
            defaultValue={selectedCameraId}
            name="cameraId"
          >
            <option value="">Semua kamera</option>
            {(cameras ?? []).map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.nama_kamera}
              </option>
            ))}
          </select>
          <input
            className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
            defaultValue={selectedDate}
            name="date"
            type="date"
          />
          <button
            className="focus-ring rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]"
            type="submit"
          >
            Terapkan
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
          <div>
            <h2 className="text-lg font-semibold">Activity logs</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{count ?? 0} log ditemukan</p>
          </div>
          <Link
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-subtle)]"
            href="/admin/logs"
          >
            Reset filter
          </Link>
        </div>

        {error ? (
          <div className="p-5 text-sm text-[var(--danger)]">Gagal memuat log: {error.message}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">Belum ada log.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead className="bg-[var(--surface-subtle)] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Kamera</th>
                  <th className="px-4 py-3 font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const profile = log.user_id ? profileById.get(log.user_id) : null;
                  const camera = log.camera_id ? cameraById.get(log.camera_id) : null;

                  return (
                    <tr className="border-t border-[var(--border)] align-top" key={log.id}>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {profile ? (
                          <span>
                            {profile.nama}
                            <span className="block text-xs text-[var(--muted)]">{profile.role}</span>
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{log.action}</td>
                      <td className="px-4 py-3">{camera?.nama_kamera ?? "-"}</td>
                      <td className="px-4 py-3">
                        <code className="block max-w-md whitespace-pre-wrap rounded-md bg-[var(--surface-subtle)] p-2 text-xs">
                          {JSON.stringify(log.metadata ?? {}, null, 2)}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-4 text-sm">
          <p className="text-[var(--muted)]">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                className="rounded-md border border-[var(--border)] px-3 py-2 font-semibold hover:bg-[var(--surface-subtle)]"
                href={buildPageHref(queryParams, currentPage - 1)}
              >
                Sebelumnya
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                className="rounded-md border border-[var(--border)] px-3 py-2 font-semibold hover:bg-[var(--surface-subtle)]"
                href={buildPageHref(queryParams, currentPage + 1)}
              >
                Berikutnya
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
