import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UnifiedNeed {
  id: string;
  workstream_id: string;
  need_type: 'approval' | 'document' | 'information' | 'review' | 'action';
  description: string;
  satisfier_role: string | null;
  status: string;
  due_at: string | null;
  created_at: string;
  workstreamName: string;
  dueText: string | null;
  isOverdue: boolean;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface TeamQueueGroup {
  role: string;
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
  count: number;
  color: string;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  color: string;
}

const ROLE_COLORS: Record<string, string> = {
  legal_ops: "hsl(var(--primary))",
  contract_counsel: "hsl(var(--chart-2))",
  general_counsel: "hsl(var(--chart-3))",
  account_executive: "hsl(var(--chart-4))",
  sales_manager: "hsl(var(--chart-5))",
  finance_reviewer: "hsl(var(--chart-1))",
};

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

export function useUnifiedNeeds(
  userRole: string = "legal_ops",
  teamRoles: string[] = ["legal_ops", "contract_counsel", "general_counsel"]
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

  const fetchUnifiedNeeds = useCallback(async (isRefresh: boolean = false) => {
    // Set refreshing state for non-initial loads
    if (isRefresh) {
      setData(prev => ({ ...prev, isRefreshing: true }));
    }
    try {
      // Fetch needs assigned to my role
      const { data: myNeedsRaw } = await supabase
        .from("needs")
        .select("id, workstream_id, need_type, description, satisfier_role, status, due_at, created_at")
        .eq("satisfier_role", userRole)
        .in("status", ["open", "expressed", "committed"])
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(20);

      // Fetch team needs (grouped by role)
      const { data: teamNeedsRaw } = await supabase
        .from("needs")
        .select("id, workstream_id, need_type, description, satisfier_role, status, due_at, created_at")
        .in("satisfier_role", teamRoles)
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

          const { data: waitingData } = await supabase
            .from("needs")
            .select("id, workstream_id, need_type, description, satisfier_role, status, due_at, created_at")
            .in("workstream_id", workstreamIds)
            .neq("status", "satisfied")
            .neq("satisfier_role", userRole)
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
          status: need.status,
          due_at: need.due_at,
          created_at: need.created_at,
          workstreamName: workstreamMap.get(need.workstream_id) || "Unknown",
          dueText: dueInfo?.text || null,
          isOverdue,
          urgency: calculateUrgency(need.due_at, isOverdue),
        };
      });

      const myOverdueCount = myNeeds.filter(n => n.isOverdue).length;

      // Transform team needs into groups
      const roleGroups: Record<string, { needs: any[]; overdueCount: number }> = {};
      for (const need of teamNeedsRaw || []) {
        const role = need.satisfier_role || "unassigned";
        if (!roleGroups[role]) {
          roleGroups[role] = { needs: [], overdueCount: 0 };
        }
        roleGroups[role].needs.push(need);
        const dueInfo = formatDueDate(need.due_at);
        if (dueInfo?.isOverdue) {
          roleGroups[role].overdueCount++;
        }
      }

      const teamGroups: TeamQueueGroup[] = Object.entries(roleGroups).map(([role, data]) => ({
        role,
        roleDisplay: role.replace(/_/g, " "),
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
          status: need.status,
          due_at: need.due_at,
          created_at: need.created_at,
          workstreamName: workstreamMap.get(need.workstream_id) || "Unknown",
          dueText: dueInfo?.text || null,
          isOverdue,
          urgency: calculateUrgency(need.due_at, isOverdue),
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
  }, [userRole, teamRoles]);

  useEffect(() => {
    fetchUnifiedNeeds(false);

    // Set up realtime subscription for live updates
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
          // Refetch when any need changes (mark as refresh)
          fetchUnifiedNeeds(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnifiedNeeds]);

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
  return groups.map(group => ({
    role: group.roleDisplay,
    count: group.count,
    color: ROLE_COLORS[group.role] || "hsl(var(--muted-foreground))",
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
