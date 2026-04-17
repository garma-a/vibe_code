"use server";

import { createClient } from "@/lib/supabase/server";

export type ManagerBookingRow = {
  id: string;
  date: string;
  reason: string;
  status: string;
  branch_manager_status: string | null;
  branch_manager_feedback: string | null;
  admin_feedback: string | null;
  manager_name: string | null;
  manager_job_title: string | null;
  manager_mobile: string | null;
  mics_count: number | null;
  has_laptop: boolean | null;
  has_video_conf: boolean | null;
  created_at: string;
  profiles: { full_name: string; employee_id: string } | null;
  rooms: { name: string; capacity: number } | null;
  time_slots: { slot_name: string } | null;
};

/** Bookings awaiting Branch Manager approval (admin must have approved first) */
export async function getPendingManagerApprovals(): Promise<ManagerBookingRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, date, reason, status, branch_manager_status, branch_manager_feedback, admin_feedback,
      manager_name, manager_job_title, manager_mobile, mics_count, has_laptop, has_video_conf, created_at,
      profiles ( full_name, employee_id ),
      rooms ( name, capacity ),
      time_slots ( slot_name )
    `)
    .eq("room_type", "multi-purpose")
    .eq("status", "approved")            // Admin must approve first
    .eq("branch_manager_status", "pending") // Then BM handles it
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching manager approvals:", error);
    return [];
  }

  return (data as unknown as ManagerBookingRow[]) || [];
}

/** All multi-purpose room bookings (history) for this branch */
export async function getAllMultiPurposeBookings(): Promise<ManagerBookingRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, date, reason, status, branch_manager_status, branch_manager_feedback, admin_feedback,
      manager_name, manager_job_title, manager_mobile, mics_count, has_laptop, has_video_conf, created_at,
      profiles ( full_name, employee_id ),
      rooms ( name, capacity ),
      time_slots ( slot_name )
    `)
    .eq("room_type", "multi-purpose")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching multi-purpose bookings:", error);
    return [];
  }

  return (data as unknown as ManagerBookingRow[]) || [];
}

/** Stats for the manager dashboard */
export async function getManagerStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("branch_manager_status")
    .eq("room_type", "multi-purpose")
    .eq("status", "approved");

  if (error || !data) return { awaitingAction: 0, approved: 0, rejected: 0, total: 0 };

  return {
    awaitingAction: data.filter((b) => b.branch_manager_status === "pending").length,
    approved: data.filter((b) => b.branch_manager_status === "approved").length,
    rejected: data.filter((b) => b.branch_manager_status === "rejected").length,
    total: data.length,
  };
}
