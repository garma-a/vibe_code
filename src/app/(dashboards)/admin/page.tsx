import { AdminDashboard } from "@/features/admin-dashboard/ui/admin-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { data: rawPending },
    { count: approvedCount },
    { count: multiActiveCount },
    { data: allRooms },
    { data: slots },
    { data: recentDecisions },
    { data: multiStatusReqs },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, room_id, time_slot_id, room_type, date, reason, status, rooms(name), time_slots(slot_name), profiles(full_name, employee_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('room_type', 'multi-purpose'),
    supabase.from('rooms').select('id, name, type').eq('is_active', true).order('name'),
    supabase.from('time_slots').select('id, slot_name, start_time, end_time').eq('is_active', true).order('start_time'),
    supabase
      .from('bookings')
      .select('id, room_type, date, reason, status, admin_feedback, rooms(name), profiles(full_name, employee_id)')
      .in('status', ['approved', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(10), // Recent Admin Decisions
    supabase
      .from('bookings')
      .select('id, room_type, date, reason, status, rooms(name), profiles(full_name, employee_id), branch_manager_status, branch_manager_feedback')
      .eq('room_type', 'multi-purpose')
      .not('branch_manager_status', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10) // Show recent 10 statuses
  ]);

  const pendingDates = Array.from(new Set((rawPending ?? []).map((booking: { date?: string | null }) => booking.date).filter(Boolean))) as string[];

  let bookingOccupancies: {
    id: string;
    date: string;
    room_id: string;
    time_slot_id: string | null;
    status: 'pending' | 'approved';
  }[] = [];

  if (pendingDates.length > 0) {
    const { data: occupancyRows } = await supabase
      .from('bookings')
      .select('id, date, room_id, time_slot_id, status')
      .in('status', ['pending', 'approved'])
      .in('date', pendingDates)
      .not('room_id', 'is', null);

    bookingOccupancies = (occupancyRows ?? []) as {
      id: string;
      date: string;
      room_id: string;
      time_slot_id: string | null;
      status: 'pending' | 'approved';
    }[];
  }

  return (
    <AdminDashboard
      initialRequests={rawPending ?? []}
      pendingCount={rawPending?.length ?? 0}
      approvedCount={approvedCount ?? 0}
      multiActiveCount={multiActiveCount ?? 0}
      allRooms={allRooms ?? []}
      timeSlots={slots ?? []}
      bookingOccupancies={bookingOccupancies}
      recentDecisions={recentDecisions ?? []}
      multiPurposeStatusRequests={multiStatusReqs ?? []}
    />
  );
}
