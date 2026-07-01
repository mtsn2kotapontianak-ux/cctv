"use server";

import { redirect } from "next/navigation";
import { isUserRole, roleHomePath } from "@/lib/auth/roles";
import { logActivity } from "@/lib/logs/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  email?: string;
  error?: string;
};

type LoginProfile = {
  id: string;
  is_active: boolean;
  nama: string;
  role: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      email,
      error: "Email dan password wajib diisi."
    };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return {
      email,
      error: "Konfigurasi Supabase belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY."
    };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    return {
      email,
      error: "Email atau password tidak sesuai."
    };
  }

  let adminSupabase: ReturnType<typeof createAdminClient>;

  try {
    adminSupabase = createAdminClient();
  } catch {
    await supabase.auth.signOut();

    return {
      email,
      error: "Konfigurasi Supabase admin belum lengkap. Isi SUPABASE_SERVICE_ROLE_KEY di server."
    };
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id,is_active,nama,role")
    .eq("id", authData.user.id)
    .maybeSingle<LoginProfile>();

  if (profileError) {
    await supabase.auth.signOut();

    return {
      email,
      error: "Profile akun gagal dibaca. Periksa tabel profiles di Supabase."
    };
  }

  if (!profile) {
    await supabase.auth.signOut();

    return {
      email,
      error: "Profile akun belum dibuat. Hubungi admin untuk melengkapi data role."
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();

    return {
      email,
      error: "Akun ini dinonaktifkan. Hubungi admin sekolah."
    };
  }

  if (!isUserRole(profile.role)) {
    await supabase.auth.signOut();

    return {
      email,
      error: "Role akun tidak valid. Hubungi admin sistem."
    };
  }

  await logActivity(adminSupabase, {
    action: "auth.login",
    metadata: {
      email,
      role: profile.role
    },
    userId: authData.user.id
  });

  redirect(roleHomePath[profile.role]);
}

export async function logoutAction() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const adminSupabase = createAdminClient();
    await logActivity(adminSupabase, {
      action: "auth.logout",
      userId: user.id
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateOwnPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const supabase = await createClient();

  if (password.length < 6) {
    redirect("/account/password?status=error&message=Password%20minimal%206%20karakter.");
  }

  if (password !== confirmPassword) {
    redirect("/account/password?status=error&message=Konfirmasi%20password%20tidak%20sama.");
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirect(`/account/password?status=error&message=${encodeURIComponent(error.message)}`);
  }

  redirect("/account/password?status=success&message=Password%20berhasil%20diubah.");
}
