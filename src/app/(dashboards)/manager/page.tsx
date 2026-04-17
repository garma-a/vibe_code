import { ManagerDashboard } from "@/features/manager-dashboard/ui/manager-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function BranchManagerPage() {
  const supabase = await createClient();

  // Branch Managers see bookings where:
  // 1. status = 'approved' (Admin has cleared it)
  // 2. branch_manager_status = 'pending' (Awaiting final decision)
  // 3. room_type = 'multi-purpose'
  const { data: requests } = await supabase
    .from('bookings')
    .select('*, rooms(name), profiles(full_name, employee_id)')
    .eq('status', 'approved')
    .eq('branch_manager_status', 'pending')
    .eq('room_type', 'multi-purpose')
    .order('created_at', { ascending: true });

  return (
    <div className="p-8">
      <ManagerDashboard pendingRequests={(requests ?? []) as any} />
    </div>
  );
}
