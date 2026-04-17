"use server";

import { createClient } from "@/lib/supabase/server";

function oneToOne<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation;
}

type PendingRaw = Omit<ManagerPendingApproval, "profiles" | "rooms" | "time_slots"> & {
  profiles:
    | {
        full_name: string;
        employee_id: string;
      }
    | {
        full_name: string;
        employee_id: string;
      }[]
    | null;
  rooms:
    | {
        id: string;
        name: string;
        type: "lecture" | "multi-purpose";
      }
    | {
        id: string;
        name: string;
        type: "lecture" | "multi-purpose";
      }[]
    | null;
  time_slots:
    | {
        id: string;
        slot_name: string;
        start_time: string;
        end_time: string;
      }
    | {
        id: string;
        slot_name: string;
        start_time: string;
        end_time: string;
      }[]
    | null;
};

type SystemRaw = Omit<ManagerSystemBooking, "profiles" | "rooms" | "time_slots"> & {
  profiles:
    | {
        full_name: string;
      }
    | {
        full_name: string;
      }[]
    | null;
  rooms:
    | {
        id: string;
        name: string;
        type: "lecture" | "multi-purpose";
      }
    | {
        id: string;
        name: string;
        type: "lecture" | "multi-purpose";
      }[]
    | null;
  time_slots:
    | {
        id: string;
        slot_name: string;
        start_time: string;
        end_time: string;
      }
    | {
        id: string;
        slot_name: string;
        start_time: string;
        end_time: string;
      }[]
    | null;
};

export type ManagerPendingApproval = {
  id: string;
  date: string;
  reason: string;
  status: string;
  room_type: "lecture" | "multi-purpose";
  room_id: string | null;
  time_slot_id: string | null;
  branch_manager_status: "pending" | "approved" | "rejected" | null;
  admin_feedback: string | null;
  manager_name: string | null;
  manager_job_title: string | null;
  manager_mobile: string | null;
  mics_count: number | null;
  has_laptop: boolean | null;
  has_video_conf: boolean | null;
  created_at: string;
  profiles: { full_name: string; employee_id: string } | null;
  rooms: { id: string; name: string; type: "lecture" | "multi-purpose" } | null;
  time_slots: { id: string; slot_name: string; start_time: string; end_time: string } | null;
};

export type ManagerSystemBooking = {
  id: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  room_type: "lecture" | "multi-purpose";
  room_id: string | null;
  time_slot_id: string | null;
  branch_manager_status: "pending" | "approved" | "rejected" | null;
  profiles: { full_name: string } | null;
  rooms: { id: string; name: string; type: "lecture" | "multi-purpose" } | null;
  time_slots: { id: string; slot_name: string; start_time: string; end_time: string } | null;
};

export type ManagerTimeSlot = {
  id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
};

export type ManagerRoom = {
  id: string;
  name: string;
  type: "lecture" | "multi-purpose";
  is_active: boolean;
};

export async function getManagerPendingApprovals(): Promise<ManagerPendingApproval[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, date, reason, status, room_type, room_id, time_slot_id, branch_manager_status, admin_feedback,
      manager_name, manager_job_title, manager_mobile, mics_count, has_laptop, has_video_conf, created_at,
      profiles ( full_name, employee_id ),
      rooms ( id, name, type ),
      time_slots ( id, slot_name, start_time, end_time )
    `)
    .eq("room_type", "multi-purpose")
    .eq("status", "approved")
    .eq("branch_manager_status", "pending")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching manager approvals:", error);
    return [];
  }

  const rows = (data ?? []) as PendingRaw[];

  return rows.map((row) => ({
    ...row,
    profiles: oneToOne(row.profiles),
    rooms: oneToOne(row.rooms),
    time_slots: oneToOne(row.time_slots),
  })) as ManagerPendingApproval[];
}

export async function getManagerSystemBookings(startDate: string, endDate: string): Promise<ManagerSystemBooking[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, date, reason, status, room_type, room_id, time_slot_id, branch_manager_status,
      profiles ( full_name ),
      rooms ( id, name, type ),
      time_slots ( id, slot_name, start_time, end_time )
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .neq("status", "rejected")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching manager calendar bookings:", error);
    return [];
  }

  const rows = (data ?? []) as SystemRaw[];

  return rows.map((row) => ({
    ...row,
    profiles: oneToOne(row.profiles),
    rooms: oneToOne(row.rooms),
    time_slots: oneToOne(row.time_slots),
  })) as ManagerSystemBooking[];
}

export async function getManagerTimeSlots(): Promise<ManagerTimeSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_slots")
    .select("id, slot_name, start_time, end_time")
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching manager time slots:", error);
    return [];
  }

  return (data as ManagerTimeSlot[]) || [];
}

export async function getManagerRooms(): Promise<ManagerRoom[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, type, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching manager rooms:", error);
    return [];
  }

  return (data as ManagerRoom[]) || [];
}
