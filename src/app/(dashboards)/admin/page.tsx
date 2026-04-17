import { DashboardPage } from "@/features/admin-dashboard/ui/dashboard-page";
import { 
  getDashboardStats, 
  getRecentBookings, 
  getAllRooms, 
  getAllTimeSlots, 
  getCalendarBookings, 
  findEmptyRooms 
} from "@/features/admin-dashboard/queries";
import { approveBooking, rejectBooking, forceAssignRoom } from "@/features/admin-dashboard/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

  const [stats, recentBookings, rooms, timeSlots] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(10),
    getAllRooms(),
    getAllTimeSlots()
  ]);

  const fetchCalendarBookingsAction = async (d: string) => {
    "use server";
    return await getCalendarBookings(d);
  };

  const searchEmptyRoomsAction = async (d: string, ts: string, rt: string) => {
    "use server";
    return await findEmptyRooms(d, ts, rt);
  };

  const approveAction = async (id: string) => {
    "use server";
    return await approveBooking(id);
  };

  const rejectAction = async (id: string, feedback: string) => {
    "use server";
    return await rejectBooking(id, feedback);
  };

  const forceAssignAction = async (data: any) => {
    "use server";
    return await forceAssignRoom(data);
  };

  return (
    <DashboardPage 
      stats={stats}
      recentBookings={recentBookings as any[]}
      rooms={rooms as any[]}
      timeSlots={timeSlots as any[]}
      fetchCalendarBookings={fetchCalendarBookingsAction}
      searchEmptyRooms={searchEmptyRoomsAction}
      approveBookingAction={approveAction}
      rejectBookingAction={rejectAction}
      forceAssignAction={forceAssignAction}
      adminName={profile?.full_name || "Admin User"}
    />
  );
}
