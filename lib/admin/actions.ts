"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { logActivity } from "@/lib/logs/activity";
import { createAdminClient } from "@/lib/supabase/admin";

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi.`);
  }

  return value;
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function roleFromForm(formData: FormData): UserRole {
  const role = String(formData.get("role") ?? "");

  if (!isUserRole(role)) {
    throw new Error("Role tidak valid.");
  }

  return role;
}

function getStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function redirectMapping(classId: string, status: "success" | "error", message: string): never {
  const params = new URLSearchParams({
    classId,
    status,
    message
  });

  redirect(`/admin/mapping?${params.toString()}`);
}

function redirectClasses(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({
    status,
    message
  });

  redirect(`/admin/classes?${params.toString()}`);
}

function redirectCameras(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({
    status,
    message
  });

  redirect(`/admin/cameras?${params.toString()}`);
}

function urlString(formData: FormData, key: string, required = true) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    if (required) {
      throw new Error(`${key} wajib diisi.`);
    }

    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function buildSnapshotUrlFromSource(tunnelUrl: string, snapshotSourceName: string | null) {
  if (!snapshotSourceName) {
    return null;
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL;
  const baseUrl = configuredBaseUrl || new URL(tunnelUrl).origin;
  const params = new URLSearchParams({
    src: snapshotSourceName
  });

  return `${baseUrl.replace(/\/$/, "")}/api/frame.jpeg?${params.toString()}`;
}

type ImportedParentUser = {
  email: string;
  nama: string;
  password: string;
  role?: UserRole;
};

function parseImportedParentUsers(jsonText: string): ImportedParentUser[] {
  const parsed = JSON.parse(jsonText) as unknown;
  const users = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed && "users" in parsed && Array.isArray(parsed.users)
      ? parsed.users
      : null;

  if (!users) {
    throw new Error("Format JSON harus berupa array user atau object { users: [...] }.");
  }

  return users.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Item user ke-${index + 1} tidak valid.`);
    }

    const record = item as Record<string, unknown>;
    const email = String(record.email ?? "").trim().toLowerCase();
    const nama = String(record.nama ?? "").trim();
    const password = String(record.password ?? "");
    const role = String(record.role ?? "parent");

    if (!email || !nama || !password) {
      throw new Error(`Item user ke-${index + 1} wajib memiliki nama, email, dan password.`);
    }

    if (!isUserRole(role) || role !== "parent") {
      throw new Error(`Item user ke-${index + 1} harus memakai role parent.`);
    }

    return {
      email,
      nama,
      password,
      role
    };
  });
}

export async function createUserAction(formData: FormData) {
  const admin = await requireAdmin();

  const email = requiredString(formData, "email").toLowerCase();
  const password = requiredString(formData, "password");
  const nama = requiredString(formData, "nama");
  const role = roleFromForm(formData);
  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Gagal membuat user auth.");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    is_active: true,
    nama,
    role
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  await logActivity(supabase, {
    action: "admin.user.create",
    metadata: {
      email,
      role,
      target_user_id: authData.user.id
    },
    userId: admin.id
  });

  revalidatePath("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = requiredString(formData, "id");
  const nama = requiredString(formData, "nama");
  const role = roleFromForm(formData);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      nama,
      role
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logActivity(supabase, {
    action: "admin.user.update",
    metadata: {
      role,
      target_user_id: id
    },
    userId: admin.id
  });

  revalidatePath("/admin/users");
}

export async function updateUserPasswordAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = requiredString(formData, "id");
  const password = requiredString(formData, "password");
  const supabase = createAdminClient();

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  const { error } = await supabase.auth.admin.updateUserById(id, {
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  await logActivity(supabase, {
    action: "admin.user.update",
    metadata: {
      password_changed: true,
      target_user_id: id
    },
    userId: admin.id
  });

  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = requiredString(formData, "id");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: false
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logActivity(supabase, {
    action: "admin.user.update",
    metadata: {
      deactivated: true,
      target_user_id: id
    },
    userId: admin.id
  });

  revalidatePath("/admin/users");
}

export async function activateUserAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = requiredString(formData, "id");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: true
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logActivity(supabase, {
    action: "admin.user.update",
    metadata: {
      activated: true,
      target_user_id: id
    },
    userId: admin.id
  });

  revalidatePath("/admin/users");
}

export async function createClassAction(formData: FormData) {
  await requireAdmin();

  const namaKelas = requiredString(formData, "nama_kelas");
  const supabase = createAdminClient();
  const { error } = await supabase.from("classes").insert({
    nama_kelas: namaKelas
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/classes");
}

export async function updateClassAction(formData: FormData) {
  await requireAdmin();

  const id = requiredString(formData, "id");
  const namaKelas = requiredString(formData, "nama_kelas");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("classes")
    .update({
      nama_kelas: namaKelas
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/classes");
}

export async function deleteClassAction(formData: FormData) {
  await requireAdmin();

  const id = requiredString(formData, "id");
  const supabase = createAdminClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/classes");
}

export async function createCameraAction(formData: FormData) {
  const admin = await requireAdmin();

  const supabase = createAdminClient();
  const tunnelUrl = urlString(formData, "tunnel_url") as string;
  const snapshotSourceName = optionalString(formData, "snapshot_source_name");
  const snapshotUrl = urlString(formData, "snapshot_url", false) ?? buildSnapshotUrlFromSource(tunnelUrl, snapshotSourceName);
  const { data, error } = await supabase.from("cameras").insert({
    nama_kamera: requiredString(formData, "nama_kamera"),
    source_name: requiredString(formData, "source_name"),
    snapshot_source_name: snapshotSourceName,
    tunnel_url: tunnelUrl,
    snapshot_url: snapshotUrl,
    deskripsi: optionalString(formData, "deskripsi"),
    is_active: formData.get("is_active") === "on"
  }).select("id,nama_kamera,source_name").single();

  if (error) {
    redirectCameras("error", error.message);
  }

  await logActivity(supabase, {
    action: "admin.camera.create",
    cameraId: data.id,
    metadata: {
      nama_kamera: data.nama_kamera,
      source_name: data.source_name
    },
    userId: admin.id
  });

  revalidatePath("/admin/cameras");
  redirectCameras("success", "Kamera berhasil ditambahkan.");
}

export async function updateCameraAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = requiredString(formData, "id");
  const supabase = createAdminClient();
  const tunnelUrl = urlString(formData, "tunnel_url") as string;
  const snapshotSourceName = optionalString(formData, "snapshot_source_name");
  const snapshotUrl = urlString(formData, "snapshot_url", false) ?? buildSnapshotUrlFromSource(tunnelUrl, snapshotSourceName);
  const { error } = await supabase
    .from("cameras")
    .update({
      nama_kamera: requiredString(formData, "nama_kamera"),
      source_name: requiredString(formData, "source_name"),
      snapshot_source_name: snapshotSourceName,
      tunnel_url: tunnelUrl,
      snapshot_url: snapshotUrl,
      deskripsi: optionalString(formData, "deskripsi"),
      is_active: formData.get("is_active") === "on"
    })
    .eq("id", id);

  if (error) {
    redirectCameras("error", error.message);
  }

  await logActivity(supabase, {
    action: "admin.camera.update",
    cameraId: id,
    metadata: {
      source_name: String(formData.get("source_name") ?? "")
    },
    userId: admin.id
  });

  revalidatePath("/admin/cameras");
  revalidatePath(`/admin/cameras/${id}`);
  redirectCameras("success", "Alamat dan data kamera berhasil diperbarui.");
}

export async function deleteCameraAction(formData: FormData) {
  await requireAdmin();

  const id = requiredString(formData, "id");
  const supabase = createAdminClient();
  const { error } = await supabase.from("cameras").delete().eq("id", id);

  if (error) {
    redirectCameras("error", error.message);
  }

  revalidatePath("/admin/cameras");
  redirectCameras("success", "Kamera berhasil dihapus.");
}

export async function updateClassMappingAction(formData: FormData) {
  const admin = await requireAdmin();

  const classId = requiredString(formData, "class_id");
  const cameraIds = getStringList(formData, "camera_ids");
  const parentIds = getStringList(formData, "parent_ids");
  const supabase = createAdminClient();

  const { error: deleteCamerasError } = await supabase
    .from("class_cameras")
    .delete()
    .eq("class_id", classId);

  if (deleteCamerasError) {
    redirectMapping(classId, "error", deleteCamerasError.message);
  }

  if (cameraIds.length > 0) {
    const { error: insertCamerasError } = await supabase.from("class_cameras").insert(
      cameraIds.map((cameraId) => ({
        class_id: classId,
        camera_id: cameraId
      }))
    );

    if (insertCamerasError) {
      redirectMapping(classId, "error", insertCamerasError.message);
    }
  }

  const { error: deleteParentsError } = await supabase
    .from("user_classes")
    .delete()
    .eq("class_id", classId);

  if (deleteParentsError) {
    redirectMapping(classId, "error", deleteParentsError.message);
  }

  if (parentIds.length > 0) {
    const { error: insertParentsError } = await supabase.from("user_classes").insert(
      parentIds.map((parentId) => ({
        class_id: classId,
        user_id: parentId
      }))
    );

    if (insertParentsError) {
      redirectMapping(classId, "error", insertParentsError.message);
    }
  }

  await logActivity(supabase, {
    action: "admin.mapping.update",
    metadata: {
      camera_count: cameraIds.length,
      class_id: classId,
      parent_count: parentIds.length
    },
    userId: admin.id
  });

  revalidatePath("/admin/mapping");
  redirectMapping(classId, "success", "Mapping kelas berhasil disimpan.");
}

export async function addParentToClassAction(formData: FormData) {
  const admin = await requireAdmin();

  const classId = requiredString(formData, "class_id");
  const userId = requiredString(formData, "user_id");
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", userId)
    .maybeSingle<{ id: string; role: UserRole }>();

  if (profileError || !profile || profile.role !== "parent") {
    redirectClasses("error", "User yang dipilih harus memiliki role Orang Tua.");
  }

  const { error } = await supabase.from("user_classes").upsert(
    {
      class_id: classId,
      user_id: userId
    },
    {
      onConflict: "user_id,class_id"
    }
  );

  if (error) {
    redirectClasses("error", error.message);
  }

  await logActivity(supabase, {
    action: "admin.mapping.update",
    metadata: {
      class_id: classId,
      parent_added: userId
    },
    userId: admin.id
  });

  revalidatePath("/admin/classes");
  redirectClasses("success", "Orang tua berhasil ditambahkan ke kelas.");
}

export async function removeParentFromClassAction(formData: FormData) {
  const admin = await requireAdmin();

  const classId = requiredString(formData, "class_id");
  const userId = requiredString(formData, "user_id");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_classes")
    .delete()
    .eq("class_id", classId)
    .eq("user_id", userId);

  if (error) {
    redirectClasses("error", error.message);
  }

  await logActivity(supabase, {
    action: "admin.mapping.update",
    metadata: {
      class_id: classId,
      parent_removed: userId
    },
    userId: admin.id
  });

  revalidatePath("/admin/classes");
  redirectClasses("success", "Orang tua berhasil dihapus dari kelas.");
}

export async function importClassParentsJsonAction(formData: FormData) {
  const admin = await requireAdmin();

  const classId = requiredString(formData, "class_id");
  const jsonText = requiredString(formData, "users_json");
  const supabase = createAdminClient();
  let users: ImportedParentUser[];

  try {
    users = parseImportedParentUsers(jsonText);
  } catch (error) {
    redirectClasses("error", error instanceof Error ? error.message : "JSON tidak valid.");
  }

  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authUsersError) {
    redirectClasses("error", authUsersError.message);
  }

  const existingByEmail = new Map(
    authUsers.users.map((user) => [(user.email ?? "").toLowerCase(), user])
  );
  let createdCount = 0;
  let mappedCount = 0;

  for (const user of users) {
    const existingUser = existingByEmail.get(user.email);
    let userId = existingUser?.id;

    if (existingUser) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: user.password
      });

      if (passwordError) {
        redirectClasses("error", passwordError.message);
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError || !authData.user) {
        redirectClasses("error", authError?.message ?? `Gagal membuat ${user.email}.`);
      }

      userId = authData.user.id;
      createdCount += 1;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        is_active: true,
        nama: user.nama,
        role: "parent"
      },
      {
        onConflict: "id"
      }
    );

    if (profileError) {
      redirectClasses("error", profileError.message);
    }

    const { error: mappingError } = await supabase.from("user_classes").upsert(
      {
        class_id: classId,
        user_id: userId
      },
      {
        onConflict: "user_id,class_id"
      }
    );

    if (mappingError) {
      redirectClasses("error", mappingError.message);
    }

    mappedCount += 1;
  }

  await logActivity(supabase, {
    action: "admin.mapping.update",
    metadata: {
      class_id: classId,
      imported_parent_count: mappedCount,
      created_parent_count: createdCount
    },
    userId: admin.id
  });

  revalidatePath("/admin/classes");
  revalidatePath("/admin/users");
  redirectClasses("success", `${mappedCount} user orang tua berhasil diproses untuk kelas.`);
}
