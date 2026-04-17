import { EmptyRoomsSearch } from "@/features/admin-dashboard/ui/empty-rooms-search";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage() {
  const supabase = await createClient();
  const [{ data: rooms }, { data: slots }] = await Promise.all([
    supabase.from('rooms').select('id, name, type').eq('is_active', true).order('name'),
    supabase.from('time_slots').select('id, slot_name, start_time, end_time').eq('is_active', true).order('start_time'),
  ]);

  return <EmptyRoomsSearch rooms={rooms ?? []} slots={slots ?? []} />;
}
