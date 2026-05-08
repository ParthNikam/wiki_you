import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>

      <AppSidebar />

      <div className="w-screen bg-black">
        {/* <SidebarTrigger className="bg-white rounded-lg"/> */}
        {children}
      </div>
    </SidebarProvider>
  );
}
