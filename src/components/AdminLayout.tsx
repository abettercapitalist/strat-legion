import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { LawSidebar } from "./LawSidebar";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <LawSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 border-b border-border flex items-center px-4 bg-background">
            <SidebarTrigger />
          </header>
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[1200px] mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
