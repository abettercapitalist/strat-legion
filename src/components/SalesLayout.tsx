import { Outlet, useNavigate } from "react-router-dom";
import { SalesSidebar } from "./SalesSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function SalesLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SalesSidebar />
        <main className="flex-1">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {profile?.full_name} • {profile?.email}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
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
