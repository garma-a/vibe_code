"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Branch Manager approves a multi-purpose booking */
export async function approveByManager(bookingId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      branch_manager_status: "approved",
      branch_manager_feedback: null,
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error approving booking:", error);
    return { success: false, error: "Failed to approve booking." };
  }

  revalidatePath("/manager");
  return { success: true };
}

/** Branch Manager rejects a multi-purpose booking with feedback */
export async function rejectByManager(bookingId: string, feedback: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      branch_manager_status: "rejected",
      branch_manager_feedback: feedback || "Rejected by Branch Manager.",
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error rejecting booking:", error);
    return { success: false, error: "Failed to reject booking." };
  }

  revalidatePath("/manager");
  return { success: true };
}
