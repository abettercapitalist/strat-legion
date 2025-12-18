import { FileText, Settings, Home, MessageSquareText, Check, FolderOpen, ClipboardCheck } from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/PB-Logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { PlaybookIcon } from "./icons/PlaybookIcon";
import { ClauseIcon } from "./icons/ClauseIcon";
import { useTheme } from "@/contexts/ThemeContext";

const getLawDeptNavigation = (mattersLabel: string, reviewLabel: string) => [
  { name: "Home", href: "/law/home", icon: Home, badge: undefined },
  { name: `Active ${mattersLabel}`, href: "/law/matters", icon: FolderOpen, badge: undefined },
  { name: reviewLabel, href: "/law/review", icon: ClipboardCheck, badge: 3 },
];

const adminNavigation = [
  { name: "Settings", href: "/law/settings", icon: Settings },
];

// Libraries in bottom-up order (building blocks → compositions)
const librariesNavigation = [
  { name: "Clause Library", href: "/law/clauses", icon: ClauseIcon },
  { name: "Response Library", href: "/law/responses", icon: MessageSquareText },
  { name: "Template Library", href: "/law/templates", icon: FileText },
];

// Admin-only library items
const playLibraryItems = [
  { name: "Play Library", href: "/admin/workstream-types", icon: PlaybookIcon },
  { name: "Approval Routes", href: "/play-library/approval-templates", icon: Check },
];

export function LawSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role } = useAuth();
  const { labels } = useTheme();
  const isCollapsed = state === "collapsed";

  // Admin roles that can see the Workstreams section
  const isAdmin = role === "general_counsel" || role === "legal_ops";
  
  const lawDeptNavigation = getLawDeptNavigation(labels.matters, labels.performanceReview);

  return (
    <Sidebar className="w-60 border-r-0 bg-sidebar text-sidebar-foreground" collapsible="icon">
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
              LAW DEPARTMENT
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 py-2">
              {lawDeptNavigation.map(item => {
                const isActive = location.pathname.startsWith(item.href);
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
                        {!isCollapsed && <span className="flex-1 text-sm">{item.name}</span>}
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

        {/* Libraries section - consolidated with bottom-up ordering */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider px-4 py-2">
              Libraries
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 py-2">
              {librariesNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
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
                        {!isCollapsed && <span className="flex-1 text-sm">{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* Play Library - admin only, at bottom of Libraries */}
              {isAdmin && playLibraryItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
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
                        {!isCollapsed && <span className="flex-1 text-sm">{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section at bottom */}
        <SidebarGroup className="mt-auto">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider px-4 py-2">
              Admin
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 py-2">
              {adminNavigation.map(item => {
                const isActive = location.pathname.startsWith(item.href);
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
                        {!isCollapsed && <span className="flex-1 text-sm">{item.name}</span>}
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
