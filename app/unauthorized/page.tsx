import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--danger)]">
          Akses ditolak
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Halaman tidak tersedia untuk role ini</h1>
        <Link
          className="focus-ring mt-6 inline-flex rounded-md bg-[var(--primary)] px-4 py-2.5 font-semibold text-white hover:bg-[var(--primary-strong)]"
          href="/login"
        >
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}
