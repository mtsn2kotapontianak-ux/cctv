import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentProfile } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "CCTV Digital Swanda";
  const profile = await getCurrentProfile();
  const dashboardPath = profile ? roleHomePath[profile.role] : null;

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm lg:grid-cols-[1fr_0.9fr]">
          <div className="login-visual relative flex min-h-[560px] flex-col justify-between overflow-hidden bg-[#102a2f] p-8 text-white">
            <div className="relative z-10">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#9fd3c7]">
                {appName}
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight">
                Portal pemantauan CCTV Digital MTs Negeri 2 Pontianak.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/72">
                Masuk menggunakan akun resmi untuk melihat kamera sesuai kelas dan role yang
                diberikan sekolah.
              </p>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center justify-center py-8">
              <div className="cctv-scene" aria-hidden="true">
                <div className="cctv-grid" />
                <div className="cctv-wall-arm" />
                <div className="cctv-body">
                  <div className="cctv-lens">
                    <div className="cctv-lens-dot" />
                  </div>
                  <div className="cctv-status" />
                </div>
                <div className="cctv-beam" />
                <div className="cctv-monitor">
                  <div className="cctv-monitor-bar" />
                  <div className="cctv-monitor-feed feed-one" />
                  <div className="cctv-monitor-feed feed-two" />
                  <div className="cctv-monitor-feed feed-three" />
                  <div className="cctv-monitor-feed feed-four" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center p-8 lg:p-10">
            <div className="w-full">
              <p className="text-sm font-semibold text-[var(--primary)]">{appName}</p>
              {profile && dashboardPath ? (
                <div className="mt-3">
                  <h2 className="text-3xl font-semibold">Anda sudah masuk</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Akun {profile.nama} masih memiliki session aktif.
                  </p>
                  <Link
                    className="btn-primary focus-ring mt-8 inline-flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2.5 font-semibold hover:bg-[var(--primary-strong)]"
                    href={dashboardPath}
                  >
                    Masuk dashboard
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="mt-3 text-3xl font-semibold">Masuk ke dashboard</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Gunakan email dan password yang diberikan oleh admin sekolah.
                  </p>
                  <LoginForm />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
