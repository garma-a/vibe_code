import { ManagerLayout } from "@/features/manager-dashboard/ui/manager-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ManagerLayout>{children}</ManagerLayout>;
}
