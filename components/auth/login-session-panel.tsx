"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { roleHomePath, type UserRole } from "@/lib/auth/roles";

type ProfileState =
  | {
      dashboardPath: string;
      nama: string;
      status: "authenticated";
    }
  | {
      status: "anonymous";
    };

type ProfileRow = {
  is_active: boolean;
  nama: string;
  role: UserRole;
};

export function LoginSessionPanel() {
  const [profileState, setProfileState] = useState<ProfileState>({ status: "anonymous" });

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("is_active,nama,role")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (!isMounted || !data?.is_active || !roleHomePath[data.role]) {
          return;
        }

        setProfileState({
          dashboardPath: roleHomePath[data.role],
          nama: data.nama,
          status: "authenticated"
        });
      } catch {
        if (isMounted) {
          setProfileState({ status: "anonymous" });
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (profileState.status === "authenticated") {
    return (
      <div className="mt-3">
        <h2 className="text-3xl font-semibold">Anda sudah masuk</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Akun {profileState.nama} masih memiliki session aktif.
        </p>
        <Link
          className="btn-primary focus-ring mt-8 inline-flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2.5 font-semibold hover:bg-[var(--primary-strong)]"
          href={profileState.dashboardPath}
        >
          Masuk dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mt-3 text-3xl font-semibold">Masuk ke dashboard</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Gunakan email dan password yang diberikan oleh admin sekolah.
      </p>
      <LoginForm />
    </>
  );
}
