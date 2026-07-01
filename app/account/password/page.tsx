import Link from "next/link";
import { redirect } from "next/navigation";
import { updateOwnPasswordAction } from "@/lib/auth/actions";
import { getCurrentProfile } from "@/lib/auth/session";
import { SubmitButton } from "@/components/admin/submit-button";

type PasswordPageProps = {
  searchParams?: Promise<{
    message?: string;
    status?: string;
  }>;
};

export default async function AccountPasswordPage({ searchParams }: PasswordPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const params = await searchParams;
  const isSuccess = params?.status === "success";
  const backHref =
    profile.role === "admin" ? "/admin" : profile.role === "principal" ? "/principal" : "/parent";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <div>
          <Link className="text-sm font-semibold text-[var(--primary)]" href={backHref}>
            Kembali ke dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Ubah Password</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{profile.nama}</p>
        </div>

        {params?.message ? (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              isSuccess
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-[var(--danger)]"
            }`}
          >
            {params.message}
          </div>
        ) : null}

        <form
          action={updateOwnPasswordAction}
          className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
        >
          <label className="grid gap-2 text-sm font-medium">
            Password baru
            <input
              className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Konfirmasi password baru
            <input
              className="focus-ring rounded-md border border-[var(--border)] px-3 py-2"
              minLength={6}
              name="confirm_password"
              required
              type="password"
            />
          </label>
          <div>
            <SubmitButton pendingLabel="Menyimpan...">Simpan Password</SubmitButton>
          </div>
        </form>
      </section>
    </main>
  );
}
