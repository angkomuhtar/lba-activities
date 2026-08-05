import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className='flex min-h-svh'>
      <Sidebar role={user.role} />
      <div className='flex min-w-0 flex-1 flex-col h-screen'>
        <Topbar title='Dashboard' username={user.username} />
        <main className='flex-1 p-4 md:p-6 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
