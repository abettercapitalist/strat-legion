import { Outlet } from "react-router-dom";
import { LawSidebar } from "./LawSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { useUser } from "@/contexts/UserContext";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function LawLayout() {
  const { user, logout } = useUser();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <LawSidebar />
        <main className="flex-1">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user?.name} • {user?.email}
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
