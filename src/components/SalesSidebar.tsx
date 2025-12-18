import { Settings, BookOpen, Home, Users, Target, FolderOpen, ClipboardCheck } from "lucide-react";
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
    name: "Home", 
    href: "/sales", 
    icon: Home,
    badge: undefined,
  },
  { 
    name: "Active Deals", 
    href: "/sales/deals", 
    icon: FolderOpen,
    badge: undefined,
  },
  { 
    name: "Performance Review", 
    href: "/sales/review", 
    icon: ClipboardCheck,
    badge: 2,
  },
  { 
    name: "My Customers", 
    href: "/sales/customers", 
    icon: Users,
    badge: undefined,
  },
  { 
    name: "My Targets", 
    href: "/sales/targets", 
    icon: Target,
    badge: undefined,
  },
  { 
    name: "Response Library", 
    href: "/sales/responses", 
    icon: BookOpen,
    badge: undefined,
  },
  { 
    name: "Settings", 
    href: "/sales/settings", 
    icon: Settings,
    badge: undefined,
  },
];

export function SalesSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      className="w-60 border-r-0 bg-sidebar text-sidebar-foreground" 
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <img 
            src={logo} 
            alt="Playbook" 
            className={`h-8 w-auto ${isCollapsed ? "mx-auto" : ""}`}
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>
        
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider px-4 py-2">
              Sales Module
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 py-2">
              {navigation.map((item) => {
                const isActive = item.href === "/sales" 
                  ? location.pathname === "/sales" 
                  : location.pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="flex-1 text-sm">{item.name}</span>
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
