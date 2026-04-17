"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ManagerApproveResult =
  | { success: true; warning?: string }
  | { success: false; error: string; code?: string };

export async function approveByManager(bookingId: string): Promise<ManagerApproveResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized.", code: "unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found.", code: "profile_not_found" };
  }

  if (profile.role !== "branch_manager") {
    return { success: false, error: "Access denied.", code: "forbidden" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      branch_manager_status: "approved",
      branch_manager_feedback: null,
    })
    .eq("id", bookingId)
    .eq("room_type", "multi-purpose")
    .eq("status", "approved")
    .eq("branch_manager_status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Error approving booking:", updateError);
    return {
      success: false,
      error: "Failed to approve booking. Please try again.",
      code: "approve_failed",
    };
  }

  if (!updated) {
    return {
      success: false,
      error: "This request is already processed or no longer valid.",
      code: "already_processed_or_invalid_state",
    };
  }

  const { error: notificationError } = await supabase.from("vip_notifications").insert({
    booking_id: bookingId,
    event_type: "multi_purpose_final_approved_by_branch_manager",
    message: `Branch Manager approved booking ${bookingId}.`,
    created_by: user.id,
  });

  revalidatePath("/manager");

  if (notificationError) {
    console.error("VIP notification insert failed:", notificationError);
    return {
      success: true,
      warning: "Approved, but VIP notification could not be recorded in this environment.",
    };
  }

  return { success: true };
}
