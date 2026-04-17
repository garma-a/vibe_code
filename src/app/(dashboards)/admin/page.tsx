import { AdminDashboard } from "@/features/admin-dashboard/ui/admin-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const [
    { data: rawPending },
    { count: approvedCount },
    { count: multiActiveCount },
    { data: rooms },
    { data: slots },
    { data: recentDecisions },
    { data: multiStatusReqs },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, room_type, date, reason, status, rooms(name), profiles(full_name, employee_id)')
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
    supabase.from('rooms').select('id, name, type').eq('is_active', true).eq('type', 'multi-purpose').order('name'),
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

  return (
    <AdminDashboard
      initialRequests={(rawPending ?? []) as any}
      pendingCount={rawPending?.length ?? 0}
      approvedCount={approvedCount ?? 0}
      multiActiveCount={multiActiveCount ?? 0}
      multiPurposeRooms={(rooms ?? []) as any}
      timeSlots={(slots ?? []) as any}
      recentDecisions={(recentDecisions ?? []) as any}
      multiPurposeStatusRequests={(multiStatusReqs ?? []) as any}
    />
  );
}
