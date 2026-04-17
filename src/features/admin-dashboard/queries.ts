import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  
  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: activeBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .gte('date', new Date().toISOString().split('T')[0]);

  const { count: pendingRequests } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const today = new Date().toISOString().split('T')[0];
  const { count: completedToday } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .eq('date', today);

  return [
    { label: "Total Rooms", value: totalRooms?.toString() || "0", icon: "DoorOpen", color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Future Bookings", value: activeBookings?.toString() || "0", icon: "Calendar", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Pending Requests", value: pendingRequests?.toString() || "0", icon: "Clock", color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Completed Today", value: completedToday?.toString() || "0", icon: "CheckCircle2", color: "text-green-400", bg: "bg-green-400/10" },
  ];
}

export async function getRecentBookings(limit: number = 10) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      room_type,
      date,
      status,
      rooms ( name ),
      profiles ( full_name ),
      time_slots ( slot_name )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch recent bookings:", error);
    return [];
  }

  return (data as any[]).map(b => ({
    id: b.id,
    room: b.rooms?.name || 'Unknown',
    user: b.profiles?.full_name || 'Unknown',
    time: b.time_slots?.slot_name || 'Unknown',
    status: b.status,
    type: b.room_type === 'multi-purpose' ? 'Multi-Purpose' : 'Lecture Room',
    date: b.date
  }));
}

export async function getAllRooms() {
  const supabase = await createClient();
  const { data } = await supabase.from('rooms').select('*').eq('is_active', true).order('name');
  return data || [];
}

export async function getAllTimeSlots() {
  const supabase = await createClient();
  const { data } = await supabase.from('time_slots').select('*').eq('is_active', true).order('start_time');
  return data || [];
}

export async function getCalendarBookings(date: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      room_id,
      time_slot_id,
      status,
      reason,
      profiles ( full_name )
    `)
    .eq('date', date)
    .neq('status', 'rejected'); // Show pending and approved

  if (error) {
    console.error("Failed to fetch calendar bookings:", error);
    return [];
  }
  return data || [];
}

export async function findEmptyRooms(date: string, timeSlotId: string, roomType?: string) {
  const supabase = await createClient();

  // 1. Get all active rooms (optionally filtered by type)
  let roomsQuery = supabase.from('rooms').select('*').eq('is_active', true);
  if (roomType && roomType !== 'all') {
    roomsQuery = roomsQuery.eq('type', roomType);
  }
  const { data: allRooms } = await roomsQuery;

  // 2. Get all bookings for that date & time slot
  const { data: bookings } = await supabase
    .from('bookings')
    .select('room_id')
    .eq('date', date)
    .eq('time_slot_id', timeSlotId)
    .in('status', ['approved', 'pending']); 
    // We consider pending as blocking availability for advanced search until rejected

  const bookedRoomIds = new Set((bookings || []).map(b => b.room_id));

  // 3. Filter out booked rooms
  const emptyRooms = (allRooms || []).filter(r => !bookedRoomIds.has(r.id));

  return emptyRooms;
}
