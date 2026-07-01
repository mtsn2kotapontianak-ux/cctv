import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { redirect } from "next/navigation";

type ClassRow = {
  id: string;
  nama_kelas: string;
};

export default async function PrincipalClassesPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "principal") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id,nama_kelas")
    .order("nama_kelas", { ascending: true })
    .returns<ClassRow[]>();

  if (error) {
    return (
      <EmptyState
        description={`Gagal memuat kelas: ${error.message}`}
        title="Daftar kelas tidak tersedia"
      />
    );
  }

  if (data.length === 0) {
    return <EmptyState description="Belum ada kelas yang dibuat admin." title="Belum ada kelas" />;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((classItem) => (
        <Link
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--primary)]"
          href={`/principal/classes/${classItem.id}`}
          key={classItem.id}
        >
          <p className="text-lg font-semibold">{classItem.nama_kelas}</p>
          <p className="mt-4 text-sm font-semibold text-[var(--primary)]">Buka live view</p>
        </Link>
      ))}
    </section>
  );
}
