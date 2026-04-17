import { UserManagement } from "@/features/admin-dashboard/ui/user-management";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const supabase = await createClient();
  const [{ data: users }, { data: delegations }] = await Promise.all([
    supabase.from('profiles').select('*').neq('role', 'admin').order('full_name'),
    supabase.from('delegations').select('*, delegator:delegator_id(full_name), substitute:substitute_id(full_name)').order('start_date', { ascending: false }),
  ]);

  return <UserManagement users={users ?? []} delegations={delegations ?? []} />;
}
