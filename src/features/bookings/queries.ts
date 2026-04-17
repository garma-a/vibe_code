"use server";

import { createClient } from "@/lib/supabase/server";

export async function getEmployeeStats() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) {
    return { pending: 0, approved: 0, rejected: 0 };
  }

  // Fetch stats from bookings table for this user
  const { data, error } = await supabase
    .from("bookings")
    .select("status")
    .eq("user_id", userData.user.id);

  if (error || !data) {
    console.error("Error fetching stats:", error);
    return { pending: 0, approved: 0, rejected: 0 };
  }

  const stats = {
    pending: data.filter((b) => b.status === "pending").length,
    approved: data.filter((b) => b.status === "approved").length,
    rejected: data.filter((b) => b.status === "rejected").length,
  };

  return stats;
}

export type BookingRow = {
  id: string;
  room_type: string;
  date: string;
  time_slot: string;
  status: "pending" | "approved" | "rejected";
  admin_feedback?: string;
  created_at: string;
};

export async function getEmployeeHistory(): Promise<BookingRow[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching history:", error);
    return [];
  }

  return data as BookingRow[];
}
