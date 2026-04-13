import supabase from "../lib/supabaseClient";

export async function createAdminNotification({
  title,
  body,
  audienceType = "all",
  targetUserId = null,
  tone = "info",
  isPopup = false,
}) {
  const { data, error } = await supabase.rpc("create_admin_notification", {
    p_title: title,
    p_body: body,
    p_audience_type: audienceType,
    p_target_user_id: targetUserId || null,
    p_tone: tone,
    p_is_popup: isPopup,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getAdminNotifications({ status = "active", limit = 20 } = {}) {
  let query = supabase
    .from("kuntai_admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getUserAdminNotifications({ userId, limit = 10 } = {}) {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    resolvedUserId = user?.id;
  }

  if (!resolvedUserId) {
    return [];
  }

  const { data, error } = await supabase
    .from("kuntai_admin_notifications")
    .select("*")
    .eq("status", "active")
    .or(`audience_type.eq.all,target_user_id.eq.${resolvedUserId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (
      error.message?.toLowerCase?.().includes("does not exist") ||
      error.message?.toLowerCase?.().includes("schema cache")
    ) {
      return [];
    }

    throw error;
  }

  return data || [];
}

export async function archiveAdminNotification(notificationId) {
  const { data, error } = await supabase.rpc("archive_admin_notification", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw error;
  }

  return data;
}
