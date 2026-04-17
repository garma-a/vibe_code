import { ManagerDashboardPage } from "@/features/manager-dashboard/ui/manager-dashboard-page";
import { getManagerStats, getPendingManagerApprovals, getAllMultiPurposeBookings } from "@/features/manager-dashboard/queries";
import { approveByManager, rejectByManager } from "@/features/manager-dashboard/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Guard: only branch_manager role can access this page
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "branch_manager") redirect("/login");

  const [stats, pendingApprovals, allBookings] = await Promise.all([
    getManagerStats(),
    getPendingManagerApprovals(),
    getAllMultiPurposeBookings(),
  ]);

  const approveAction = async (id: string) => {
    "use server";
    return await approveByManager(id);
  };

  const rejectAction = async (id: string, feedback: string) => {
    "use server";
    return await rejectByManager(id, feedback);
  };

  return (
    <ManagerDashboardPage
      managerName={profile?.full_name || "Branch Manager"}
      stats={stats}
      pendingApprovals={pendingApprovals}
      allBookings={allBookings}
      approveAction={approveAction}
      rejectAction={rejectAction}
    />
  );
}
