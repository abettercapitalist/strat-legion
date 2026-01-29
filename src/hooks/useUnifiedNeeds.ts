import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UnifiedNeed {
  id: string;
  workstream_id: string;
  need_type: 'approval' | 'document' | 'information' | 'review' | 'action';
  description: string;
  satisfier_role: string | null;
  satisfier_type: string | null;
  status: string;
  due_at: string | null;
  created_at: string;
  workstreamName: string;
  dueText: string | null;
  isOverdue: boolean;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  roleDisplayName?: string;
}

export interface TeamQueueGroup {
  role: string;
  roleId: string;
  roleDisplay: string;
  count: number;
  exampleDescription: string;
  overdueCount: number;
}

export interface LaneData {
  items: UnifiedNeed[];
  totalCount: number;
  overdueCount: number;
  healthPercentage: number;
}

export interface TeamLaneData {
  groups: TeamQueueGroup[];
  totalCount: number;
  overdueCount: number;
  healthPercentage: number;
}

export interface UnifiedNeedsData {
  myActions: LaneData;
  teamQueue: TeamLaneData;
  waitingFor: LaneData;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

export interface NeedTypeBreakdown {
  type: string;
  count: number;
  color: string;
}

export interface RoleBreakdown {
  role: string;
  roleId: string;
  count: number;
  color: string;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  color: string;
}

// Dynamic color palette for roles (assigned by index)
const ROLE_COLOR_PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

const NEED_TYPE_COLORS: Record<string, string> = {
  approval: "hsl(var(--primary))",
  document: "hsl(210 100% 50%)",
  information: "hsl(45 100% 50%)",
  review: "hsl(280 70% 50%)",
  action: "hsl(142 70% 45%)",
};

const STATUS_COLORS: Record<string, string> = {
  open: "hsl(var(--muted-foreground))",
  expressed: "hsl(45 100% 50%)",
  committed: "hsl(var(--primary))",
};

function formatDueDate(dueAt: string | null): { text: string; isOverdue: boolean } | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const isOverdue = isPast(due);
  const text = formatDistanceToNow(due, { addSuffix: true });
  return { text, isOverdue };
}

function calculateUrgency(dueAt: string | null, isOverdue: boolean): UnifiedNeed['urgency'] {
  if (isOverdue) return 'critical';
  if (!dueAt) return 'low';
  
  const due = new Date(dueAt);
  const now = new Date();
  const daysUntilDue = differenceInDays(due, now);
  
  if (daysUntilDue <= 1) return 'high';
  if (daysUntilDue <= 3) return 'medium';
  return 'low';
}

function calculateHealthPercentage(totalCount: number, overdueCount: number): number {
  if (totalCount === 0) return 100;
  const overduePercentage = (overdueCount / totalCount) * 100;
  return Math.max(0, 100 - overduePercentage);
}

interface RoleInfo {
  id: string;
  name: string;
  displayName: string;
}

/**
 * Unified needs hook supporting both:
 * - Legacy string-based roles (satisfier_type = 'role')
 * - New UUID-based roles (satisfier_type = 'custom_role')
 */
export function useUnifiedNeeds(
  userRole: string = "legal_ops",
  teamRoles: string[] = ["legal_ops", "contract_counsel", "general_counsel"],
  workRoutingRoleIds: string[] = []
): UnifiedNeedsData {
  const [data, setData] = useState<UnifiedNeedsData>({
    myActions: { items: [], totalCount: 0, overdueCount: 0, healthPercentage: 100 },
    teamQueue: { groups: [], totalCount: 0, overdueCount: 0, healthPercentage: 100 },
    waitingFor: { items: [], totalCount: 0, overdueCount: 0, healthPercentage: 100 },
    isLoading: true,
    isRefreshing: false,
    lastUpdated: null,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [roleMap, setRoleMap] = useState<Map<string, RoleInfo>>(new Map());
  const [rolesReady, setRolesReady] = useState(false);
  
  // Debounce timer ref to prevent rapid re-renders from realtime updates
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Fetch role display names on mount
  useEffect(() => {
    async function fetchRoles() {
      const { data: roles } = await supabase
        .from("roles")
        .select("id, name, display_name")
        .eq("is_work_routing", true);
      
      if (roles) {
        const map = new Map<string, RoleInfo>();
        roles.forEach(r => {
          map.set(r.id, {
            id: r.id,
            name: r.name,
            displayName: r.display_name || r.name.replace(/_/g, " "),
          });
          // Also map by name for legacy support
          map.set(r.name, {
            id: r.id,
            name: r.name,
            displayName: r.display_name || r.name.replace(/_/g, " "),
          });
        });
        setRoleMap(map);
      }
      setRolesReady(true);
    }
    fetchRoles();
  }, []);

  // Build combined filter for both legacy and new role systems
  const allRolesToMatch = useMemo(() => {
    const roles = new Set<string>();
    // Add legacy string roles
    teamRoles.forEach(r => roles.add(r));
    // Add UUID-based roles
    workRoutingRoleIds.forEach(r => roles.add(r));
    return Array.from(roles);
  }, [teamRoles, workRoutingRoleIds]);

  const myRolesToMatch = useMemo(() => {
    const roles = new Set<string>();
    roles.add(userRole);
    workRoutingRoleIds.forEach(r => roles.add(r));
    return Array.from(roles);
  }, [userRole, workRoutingRoleIds]);

  const fetchUnifiedNeeds = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setData(prev => ({ ...prev, isRefreshing: true }));
    }
    try {
      // Fetch needs assigned to my roles (both legacy and new)
      const { data: myNeedsRaw } = await supabase
        .from("needs")
        .select("id, workstream_id, need_type, description, satisfier_role, satisfier_type, status, due_at, created_at")
        .in("satisfier_role", myRolesToMatch)
        .in("status", ["open", "expressed", "committed"])
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(20);

      // Fetch team needs (both legacy and new)
      const { data: teamNeedsRaw } = await supabase
        .from("needs")
        .select("id, workstream_id, need_type, description, satisfier_role, satisfier_type, status, due_at, created_at")
        .in("satisfier_role", allRolesToMatch)
        .in("status", ["open", "expressed"])
        .order("created_at", { ascending: false })
        .limit(100);

      // Get current user for waiting-for query
      const { data: { user } } = await supabase.auth.getUser();
      
      let waitingNeedsRaw: any[] = [];
      let myWorkstreamMap = new Map<string, string>();
      
      if (user) {
        const { data: myWorkstreams } = await supabase
          .from("workstreams")
          .select("id, name")
          .eq("owner_id", user.id);

        if (myWorkstreams && myWorkstreams.length > 0) {
          myWorkstreamMap = new Map(myWorkstreams.map(w => [w.id, w.name]));
          const workstreamIds = myWorkstreams.map(w => w.id);

          // Waiting-for: needs NOT in my roles
          const { data: waitingData } = await supabase
            .from("needs")
            .select("id, workstream_id, need_type, description, satisfier_role, satisfier_type, status, due_at, created_at")
            .in("workstream_id", workstreamIds)
            .neq("status", "satisfied")
            .not("satisfier_role", "in", `(${myRolesToMatch.join(",")})`)
            .order("due_at", { ascending: true, nullsFirst: false })
            .limit(20);

          waitingNeedsRaw = waitingData || [];
        }
      }

      // Enrich with workstream names
      const allWorkstreamIds = new Set([
        ...(myNeedsRaw || []).map(n => n.workstream_id),
        ...(teamNeedsRaw || []).map(n => n.workstream_id),
      ]);

      const { data: workstreams } = await supabase
        .from("workstreams")
        .select("id, name")
        .in("id", Array.from(allWorkstreamIds));

      const workstreamMap = new Map((workstreams || []).map(w => [w.id, w.name]));
      
      // Merge with user's workstream map for waiting-for
      for (const [id, name] of myWorkstreamMap) {
        workstreamMap.set(id, name);
      }

      // Helper to get role display name
      const getRoleDisplayName = (satisfierRole: string | null): string => {
        if (!satisfierRole) return "Unassigned";
        const info = roleMap.get(satisfierRole);
        if (info) return info.displayName;
        // Fallback: format the string
        return satisfierRole.replace(/_/g, " ");
      };

      // Transform my needs
      const myNeeds: UnifiedNeed[] = (myNeedsRaw || []).map(need => {
        const dueInfo = formatDueDate(need.due_at);
        const isOverdue = dueInfo?.isOverdue || false;
        return {
          id: need.id,
          workstream_id: need.workstream_id,
          need_type: need.need_type as UnifiedNeed['need_type'],
          description: need.description,
          satisfier_role: need.satisfier_role,
          satisfier_type: need.satisfier_type,
          status: need.status,
          due_at: need.due_at,
          created_at: need.created_at,
          workstreamName: workstreamMap.get(need.workstream_id) || "Unknown",
          dueText: dueInfo?.text || null,
          isOverdue,
          urgency: calculateUrgency(need.due_at, isOverdue),
          roleDisplayName: getRoleDisplayName(need.satisfier_role),
        };
      });

      const myOverdueCount = myNeeds.filter(n => n.isOverdue).length;

      // Transform team needs into groups (exclude items in my roles)
      const roleGroups: Record<string, { needs: any[]; overdueCount: number; roleId: string }> = {};
      for (const need of teamNeedsRaw || []) {
        const role = need.satisfier_role || "unassigned";
        // Skip items that are in my roles (to avoid double-counting)
        if (myRolesToMatch.includes(role)) continue;
        
        if (!roleGroups[role]) {
          roleGroups[role] = { needs: [], overdueCount: 0, roleId: role };
        }
        roleGroups[role].needs.push(need);
        const dueInfo = formatDueDate(need.due_at);
        if (dueInfo?.isOverdue) {
          roleGroups[role].overdueCount++;
        }
      }

      const teamGroups: TeamQueueGroup[] = Object.entries(roleGroups).map(([role, data]) => ({
        role,
        roleId: data.roleId,
        roleDisplay: getRoleDisplayName(role),
        count: data.needs.length,
        exampleDescription: data.needs[0]?.description || "",
        overdueCount: data.overdueCount,
      }));

      const teamTotalCount = teamGroups.reduce((acc, g) => acc + g.count, 0);
      const teamOverdueCount = teamGroups.reduce((acc, g) => acc + g.overdueCount, 0);

      // Transform waiting-for needs
      const waitingNeeds: UnifiedNeed[] = waitingNeedsRaw.map(need => {
        const dueInfo = formatDueDate(need.due_at);
        const isOverdue = dueInfo?.isOverdue || false;
        return {
          id: need.id,
          workstream_id: need.workstream_id,
          need_type: need.need_type as UnifiedNeed['need_type'],
          description: need.description,
          satisfier_role: need.satisfier_role,
          satisfier_type: need.satisfier_type,
          status: need.status,
          due_at: need.due_at,
          created_at: need.created_at,
          workstreamName: workstreamMap.get(need.workstream_id) || "Unknown",
          dueText: dueInfo?.text || null,
          isOverdue,
          urgency: calculateUrgency(need.due_at, isOverdue),
          roleDisplayName: getRoleDisplayName(need.satisfier_role),
        };
      });

      const waitingOverdueCount = waitingNeeds.filter(n => n.isOverdue).length;

      setData({
        myActions: {
          items: myNeeds,
          totalCount: myNeeds.length,
          overdueCount: myOverdueCount,
          healthPercentage: calculateHealthPercentage(myNeeds.length, myOverdueCount),
        },
        teamQueue: {
          groups: teamGroups,
          totalCount: teamTotalCount,
          overdueCount: teamOverdueCount,
          healthPercentage: calculateHealthPercentage(teamTotalCount, teamOverdueCount),
        },
        waitingFor: {
          items: waitingNeeds,
          totalCount: waitingNeeds.length,
          overdueCount: waitingOverdueCount,
          healthPercentage: calculateHealthPercentage(waitingNeeds.length, waitingOverdueCount),
        },
        isLoading: false,
        isRefreshing: false,
        lastUpdated: new Date(),
      });
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error fetching unified needs:", error);
      setData(prev => ({ ...prev, isLoading: false, isRefreshing: false }));
    }
  }, [userRole, allRolesToMatch, myRolesToMatch, roleMap]);

  useEffect(() => {
    // Wait until roles are loaded to prevent flipping between lanes
    if (!rolesReady) return;

    fetchUnifiedNeeds(false);

    // Set up realtime subscription for live updates with debouncing
    const channel: RealtimeChannel = supabase
      .channel('unified-needs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'needs',
        },
        () => {
          // Debounce to prevent rapid re-renders causing visual flipping
          clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            fetchUnifiedNeeds(true);
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [rolesReady, fetchUnifiedNeeds]);

  return data;
}

export function getNeedTypeBreakdown(needs: UnifiedNeed[]): NeedTypeBreakdown[] {
  const counts: Record<string, number> = {};
  for (const need of needs) {
    counts[need.need_type] = (counts[need.need_type] || 0) + 1;
  }
  return Object.entries(counts).map(([type, count]) => ({
    type,
    count,
    color: NEED_TYPE_COLORS[type] || "hsl(var(--muted-foreground))",
  }));
}

export function getRoleBreakdown(groups: TeamQueueGroup[]): RoleBreakdown[] {
  return groups.map((group, index) => ({
    role: group.roleDisplay,
    roleId: group.roleId,
    count: group.count,
    color: ROLE_COLOR_PALETTE[index % ROLE_COLOR_PALETTE.length],
  }));
}

export function getStatusBreakdown(needs: UnifiedNeed[]): StatusBreakdown[] {
  const counts: Record<string, number> = {};
  for (const need of needs) {
    counts[need.status] = (counts[need.status] || 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    color: STATUS_COLORS[status] || "hsl(var(--muted-foreground))",
  }));
}