import { SystemSettings } from "@/features/admin-dashboard/ui/system-settings";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: rooms }, { data: slots }] = await Promise.all([
    supabase.from('rooms').select('*').order('name'),
    supabase.from('time_slots').select('*').order('start_time'),
  ]);

  return <SystemSettings rooms={rooms ?? []} slots={slots ?? []} />;
}
