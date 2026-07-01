import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { logActivity } from "@/lib/logs/activity";
import { createClient } from "@/lib/supabase/server";
import type { LiveCamera } from "@/components/cameras/live-camera-player";

type ClassRow = {
  id: string;
  nama_kelas: string;
};

type ClassCameraRow = {
  camera_id: string;
};

type CameraRow = LiveCamera;

export async function getClassLiveView(classId: string, allowedRole: "principal" | "parent") {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== allowedRole) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data: classItem, error: classError } = await supabase
    .from("classes")
    .select("id,nama_kelas")
    .eq("id", classId)
    .maybeSingle<ClassRow>();

  if (classError) {
    throw new Error(classError.message);
  }

  if (!classItem) {
    return {
      cameras: [] as LiveCamera[],
      classItem: null
    };
  }

  await logActivity(supabase, {
    action: "class.open",
    metadata: {
      class_id: classId,
      role: profile.role
    },
    userId: profile.id
  });

  const { data: mappings, error: mappingError } = await supabase
    .from("class_cameras")
    .select("camera_id")
    .eq("class_id", classId)
    .returns<ClassCameraRow[]>();

  if (mappingError) {
    throw new Error(mappingError.message);
  }

  const cameraIds = mappings.map((mapping) => mapping.camera_id);

  if (cameraIds.length === 0) {
    return {
      cameras: [] as LiveCamera[],
      classItem
    };
  }

  const { data: cameras, error: camerasError } = await supabase
    .from("cameras")
    .select("id,nama_kamera,source_name,tunnel_url,deskripsi,is_active")
    .in("id", cameraIds)
    .eq("is_active", true)
    .order("nama_kamera", { ascending: true })
    .returns<CameraRow[]>();

  if (camerasError) {
    throw new Error(camerasError.message);
  }

  await Promise.all(
    cameras.map((camera) =>
      logActivity(supabase, {
        action: "camera.view_live",
        cameraId: camera.id,
        metadata: {
          class_id: classId,
          role: profile.role
        },
        userId: profile.id
      })
    )
  );

  return {
    cameras,
    classItem
  };
}
