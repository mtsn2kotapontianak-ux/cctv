import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { isUserRole, roleHomePath, type UserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  is_active: boolean;
  nama: string;
  role: UserRole;
};

type RawProfile = {
  id: string;
  is_active: boolean;
  nama: string;
  role: string;
};

export const getCurrentUser = cache(async (): Promise<User | null> => {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,is_active,nama,role")
    .eq("id", user.id)
    .maybeSingle<RawProfile>();

  if (error || !data || !data.is_active || !isUserRole(data.role)) {
    return null;
  }

  return {
    id: data.id,
    is_active: data.is_active,
    nama: data.nama,
    role: data.role
  };
});

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/unauthorized");
  }

  return profile;
}

export function redirectByRole(profile: CurrentProfile): never {
  redirect(roleHomePath[profile.role]);
}
