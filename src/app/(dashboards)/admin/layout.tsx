import { AdminLayout } from "@/features/admin-dashboard/ui/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
