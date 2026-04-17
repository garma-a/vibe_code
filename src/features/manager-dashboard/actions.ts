"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ManagerApproveResult =
  | { success: true; warning?: string }
  | { success: false; error: string; code?: string };

type BookingTarget = {
  id: string;
  status: "pending" | "approved" | "rejected";
  room_type: "lecture" | "multi-purpose";
  branch_manager_status: "pending" | "approved" | "rejected" | null;
  profiles: { role: string } | { role: string }[] | null;
};

function oneToOneRole(relation: BookingTarget["profiles"]): string | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0]?.role ?? null;
  return relation.role;
}

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

  const { data: targetRaw, error: targetError } = await supabase
    .from("bookings")
    .select("id, status, room_type, branch_manager_status, profiles ( role )")
    .eq("id", bookingId)
    .maybeSingle();

  if (targetError) {
    console.error("Error fetching booking target:", targetError);
    return {
      success: false,
      error: "Could not verify booking ownership.",
      code: "target_fetch_failed",
    };
  }

  if (!targetRaw) {
    return { success: false, error: "Booking not found.", code: "booking_not_found" };
  }

  const target = targetRaw as BookingTarget;
  const requesterRole = oneToOneRole(target.profiles);

  if (requesterRole !== "admin") {
    return {
      success: false,
      error: "You can only process requests created by Admin.",
      code: "not_admin_request",
    };
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

export async function rejectByManager(bookingId: string): Promise<ManagerApproveResult> {
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

  const { data: targetRaw, error: targetError } = await supabase
    .from("bookings")
    .select("id, status, room_type, branch_manager_status, profiles ( role )")
    .eq("id", bookingId)
    .maybeSingle();

  if (targetError) {
    console.error("Error fetching booking target:", targetError);
    return {
      success: false,
      error: "Could not verify booking ownership.",
      code: "target_fetch_failed",
    };
  }

  if (!targetRaw) {
    return { success: false, error: "Booking not found.", code: "booking_not_found" };
  }

  const target = targetRaw as BookingTarget;
  const requesterRole = oneToOneRole(target.profiles);

  if (requesterRole !== "admin") {
    return {
      success: false,
      error: "You can only process requests created by Admin.",
      code: "not_admin_request",
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "rejected",
      branch_manager_status: "rejected",
      branch_manager_feedback: "Rejected by Branch Manager.",
    })
    .eq("id", bookingId)
    .eq("room_type", "multi-purpose")
    .eq("status", "approved")
    .eq("branch_manager_status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Error rejecting booking:", updateError);
    return {
      success: false,
      error: "Failed to reject booking. Please try again.",
      code: "reject_failed",
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
    event_type: "multi_purpose_rejected_by_branch_manager",
    message: `Branch Manager rejected booking ${bookingId}.`,
    created_by: user.id,
  });

  revalidatePath("/manager");

  if (notificationError) {
    console.error("VIP notification insert failed:", notificationError);
    return {
      success: true,
      warning: "Rejected, but VIP notification could not be recorded in this environment.",
    };
  }

  return { success: true };
}
