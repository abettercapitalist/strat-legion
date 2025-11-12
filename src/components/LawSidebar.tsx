import { FileText, Library, Inbox, BarChart3, Settings } from "lucide-react";
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
    name: "Templates", 
    href: "/law/templates", 
    icon: FileText,
    children: [
      { name: "All Templates", href: "/law/templates" },
      { name: "Create New", href: "/law/templates/new" },
      { name: "Archived", href: "/law/templates/archived" },
    ]
  },
  { 
    name: "Clause Library", 
    href: "/law/clauses", 
    icon: Library,
    children: [
      { name: "Browse Clauses", href: "/law/clauses" },
      { name: "Create Clause", href: "/law/clauses/new" },
    ]
  },
  { 
    name: "Change Requests", 
    href: "/law/requests", 
    icon: Inbox,
    badge: 3,
    children: [
      { name: "Pending", href: "/law/requests", badge: 3 },
      { name: "Approved", href: "/law/requests/approved" },
      { name: "Rejected", href: "/law/requests/rejected" },
    ]
  },
  { 
    name: "Learning Dashboard", 
    href: "/law/dashboard", 
    icon: BarChart3 
  },
  { 
    name: "Settings", 
    href: "/law/settings", 
    icon: Settings 
  },
];

export function LawSidebar() {
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
          {!isCollapsed && <SidebarGroupLabel>Law Module</SidebarGroupLabel>}
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
