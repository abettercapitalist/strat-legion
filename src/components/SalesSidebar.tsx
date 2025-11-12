import { Handshake, ClipboardCheck, BarChart3, Settings, BookOpen } from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/PB-Logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const navigation = [
  { 
    name: "Deals", 
    href: "/sales/deals", 
    icon: Handshake,
    children: [
      { name: "My Deals", href: "/sales/deals" },
      { name: "All Deals", href: "/sales/deals/all" },
      { name: "Create New", href: "/sales/deals/new" },
      { name: "Closed", href: "/sales/deals/closed" },
    ]
  },
  { 
    name: "Approvals", 
    href: "/sales/approvals", 
    icon: ClipboardCheck,
    badge: 5,
    children: [
      { name: "Pending", href: "/sales/approvals", badge: 5 },
      { name: "History", href: "/sales/approvals/history" },
    ]
  },
  { 
    name: "Response Library", 
    href: "/sales/responses", 
    icon: BookOpen 
  },
  { 
    name: "Pipeline", 
    href: "/sales/pipeline", 
    icon: BarChart3,
    children: [
      { name: "Dashboard", href: "/sales/pipeline" },
      { name: "Forecast", href: "/sales/pipeline/forecast" },
    ]
  },
  { 
    name: "Settings", 
    href: "/sales/settings", 
    icon: Settings 
  },
];

export function SalesSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          {!isCollapsed && (
            <img src={logo} alt="Playbook" className="h-8 w-auto" />
          )}
          {isCollapsed && (
            <img src={logo} alt="Playbook" className="h-8 w-auto mx-auto" />
          )}
        </div>
        
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Sales Module</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="flex-1">{item.name}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
