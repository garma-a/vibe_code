import { ManagerDashboardPage } from "@/features/manager-dashboard/ui/manager-dashboard-page";
import {
  getManagerPendingApprovals,
  getManagerSystemBookings,
  getManagerRooms,
  getManagerTimeSlots,
} from "@/features/manager-dashboard/queries";
import { approveByManager } from "@/features/manager-dashboard/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role !== "branch_manager") {
    if (profile.role === "admin") redirect("/admin");
    if (profile.role === "secretary") redirect("/secretary");
    redirect("/employee");
  }

  const [pendingApprovals, rooms, timeSlots] = await Promise.all([
    getManagerPendingApprovals(),
    getManagerRooms(),
    getManagerTimeSlots(),
  ]);

  const approveAction = async (id: string) => {
    "use server";
    return await approveByManager(id);
  };

  const fetchSystemBookingsAction = async (startDate: string, endDate: string) => {
    "use server";
    return await getManagerSystemBookings(startDate, endDate);
  };

  return (
    <ManagerDashboardPage
      managerName={profile?.full_name || "Branch Manager"}
      pendingApprovals={pendingApprovals}
      rooms={rooms}
      timeSlots={timeSlots}
      fetchSystemBookingsAction={fetchSystemBookingsAction}
      approveAction={approveAction}
    />
  );
}
