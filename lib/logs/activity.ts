import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/session";

export type ActivityAction =
  | "auth.login"
  | "auth.logout"
  | "camera.view_live"
  | "camera.view_snapshot"
  | "class.open"
  | "admin.user.create"
  | "admin.user.update"
  | "admin.camera.create"
  | "admin.camera.update"
  | "admin.mapping.update";

type LogActivityOptions = {
  userId?: string;
};

type LogActivityInput = LogActivityOptions & {
  action: string;
  cameraId?: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(
  supabase: SupabaseClient,
  actionOrInput: ActivityAction | LogActivityInput,
  cameraId?: string,
  metadata: Record<string, unknown> = {}
) {
  const enabled = process.env.ACTIVITY_LOG_ENABLED !== "false";

  if (!enabled) {
    return;
  }

  const input =
    typeof actionOrInput === "string"
      ? {
          action: actionOrInput,
          cameraId,
          metadata
        }
      : actionOrInput;
  const userId = input.userId ?? (await getCurrentUser())?.id;

  if (!userId) {
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: input.action,
    camera_id: input.cameraId ?? null,
    metadata: input.metadata ?? {}
  });
}
