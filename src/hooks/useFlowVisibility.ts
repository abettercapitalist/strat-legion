import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, differenceInDays, isPast } from "date-fns";

interface WaitingItem {
  id: string;
  name: string;
  dueText: string;
  isOverdue?: boolean;
}

interface WaitingOnOthersItem {
  role: string;
  count: number;
}

interface AtRiskItem {
  id: string;
  name: string;
  reason: string;
}

interface FlowVisibilityData {
  waitingOnMe: WaitingItem[];
  waitingOnOthers: WaitingOnOthersItem[];
  atRiskItems: AtRiskItem[];
  userLoad: number;
  teamAverage: number;
  isLoading: boolean;
}

export function useFlowVisibility(teamCategory?: string): FlowVisibilityData {
  const [data, setData] = useState<FlowVisibilityData>({
    waitingOnMe: [],
    waitingOnOthers: [],
    atRiskItems: [],
    userLoad: 0,
    teamAverage: 0,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchFlowData() {
      try {
        // Fetch pending approvals with workstream info
        const { data: pendingApprovals } = await supabase
          .from("workstream_approvals")
          .select(`
            id,
            status,
            current_gate,
            submitted_at,
            workstream:workstreams(
              id,
              name,
              expected_close_date,
              stage,
              counterparty:counterparties(name)
            ),
            template:approval_templates(
              approval_sequence
            )
          `)
          .eq("status", "pending");

        // Fetch workstreams with no recent activity (at risk)
        // Also include owner_id to calculate team workload
        const { data: allWorkstreams } = await supabase
          .from("workstreams")
          .select(`
            id,
            name,
            expected_close_date,
            stage,
            updated_at,
            owner_id,
            counterparty:counterparties(name),
            workstream_type:workstream_types(team_category)
          `)
          .not("stage", "eq", "closed");

        // Fetch recent activity to determine stale workstreams
        const { data: recentActivity } = await supabase
          .from("workstream_activity")
          .select("workstream_id, created_at")
          .order("created_at", { ascending: false });

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Build activity map (most recent activity per workstream)
        const activityMap = new Map<string, Date>();
        recentActivity?.forEach((activity) => {
          if (!activityMap.has(activity.workstream_id)) {
            activityMap.set(activity.workstream_id, new Date(activity.created_at));
          }
        });

        // Process waiting on me - approvals where current user would be approver
        // For now, show all pending approvals (would filter by user role in production)
        const waitingOnMe: WaitingItem[] = [];
        const waitingOnOthersMap = new Map<string, number>();

        pendingApprovals?.forEach((approval) => {
          if (!approval.workstream) return;
          
          const workstream = approval.workstream as any;
          const template = approval.template as any;
          const expectedClose = workstream.expected_close_date 
            ? new Date(workstream.expected_close_date) 
            : null;
          
          const isOverdue = expectedClose ? isPast(expectedClose) : false;
          const dueText = expectedClose 
            ? isOverdue 
              ? `overdue ${formatDistanceToNow(expectedClose)}`
              : `due ${formatDistanceToNow(expectedClose, { addSuffix: true })}`
            : "no due date";

          // Get current gate role from approval sequence
          const sequence = template?.approval_sequence || [];
          const currentGate = approval.current_gate || 1;
          const currentStep = sequence.find((s: any) => s.gate === currentGate);
          const roleName = currentStep?.role || "Approver";

          // For demo, show first few as "waiting on me"
          if (waitingOnMe.length < 3) {
            waitingOnMe.push({
              id: workstream.id,
              name: workstream.counterparty?.name || workstream.name,
              dueText,
              isOverdue,
            });
          } else {
            // Group others by role
            const count = waitingOnOthersMap.get(roleName) || 0;
            waitingOnOthersMap.set(roleName, count + 1);
          }
        });

        // Convert map to array
        const waitingOnOthers: WaitingOnOthersItem[] = Array.from(
          waitingOnOthersMap.entries()
        ).map(([role, count]) => ({ role, count }));

        // Find at-risk items - only include items that are actionable by the user
        // An item is at-risk if it's waiting on the user AND (stale or overdue)
        const atRiskItems: AtRiskItem[] = [];
        const now = new Date();
        
        // Create a set of workstream IDs that are waiting on the user
        const waitingOnMeIds = new Set(waitingOnMe.map(item => item.id));

        // Check items waiting on me for risk factors
        waitingOnMe.forEach((item) => {
          if (item.isOverdue) {
            atRiskItems.push({
              id: item.id,
              name: item.name,
              reason: `overdue - ${item.dueText}`,
            });
          }
        });

        // Also check workstreams owned by user for staleness (if not already in waiting list)
        allWorkstreams?.forEach((workstream) => {
          // Skip if already flagged via waiting-on-me
          if (waitingOnMeIds.has(workstream.id)) return;
          
          // Only check workstreams owned by current user
          if (workstream.owner_id !== currentUserId) return;
          
          const lastActivity = activityMap.get(workstream.id);
          const daysSinceActivity = lastActivity 
            ? differenceInDays(now, lastActivity)
            : differenceInDays(now, new Date(workstream.updated_at));
          
          const expectedClose = workstream.expected_close_date 
            ? new Date(workstream.expected_close_date) 
            : null;
          const daysOverdue = expectedClose && isPast(expectedClose)
            ? differenceInDays(now, expectedClose)
            : 0;

          if (daysOverdue >= 3) {
            atRiskItems.push({
              id: workstream.id,
              name: (workstream.counterparty as any)?.name || workstream.name,
              reason: `overdue ${daysOverdue} days`,
            });
          } else if (daysSinceActivity >= 7) {
            atRiskItems.push({
              id: workstream.id,
              name: (workstream.counterparty as any)?.name || workstream.name,
              reason: `stale ${daysSinceActivity} days`,
            });
          }
        });

        // Calculate workload based on active workstreams
        // Filter by team category if specified
        const filteredWorkstreams = teamCategory 
          ? allWorkstreams?.filter((w: any) => w.workstream_type?.team_category === teamCategory)
          : allWorkstreams;

        // Count workstreams per owner to calculate team workload
        const ownerWorkloadMap = new Map<string, number>();
        filteredWorkstreams?.forEach((w) => {
          if (w.owner_id) {
            const count = ownerWorkloadMap.get(w.owner_id) || 0;
            ownerWorkloadMap.set(w.owner_id, count + 1);
          }
        });

        // Calculate user's workload (their active workstreams)
        const userWorkstreamsCount = currentUserId 
          ? (ownerWorkloadMap.get(currentUserId) || 0)
          : filteredWorkstreams?.length || 0;
        
        // Calculate team average (average workstreams per team member)
        const teamMembers = ownerWorkloadMap.size || 1;
        const totalWorkstreams = filteredWorkstreams?.length || 0;
        const avgWorkstreamsPerMember = totalWorkstreams / teamMembers;

        // Normalize to 0-100 scale (assuming 10 workstreams = 100% capacity)
        const maxCapacity = 10;
        const userLoad = Math.min(100, (userWorkstreamsCount / maxCapacity) * 100);
        const teamAverage = Math.min(100, (avgWorkstreamsPerMember / maxCapacity) * 100);

        setData({
          waitingOnMe: waitingOnMe.slice(0, 5),
          waitingOnOthers: waitingOnOthers.slice(0, 5),
          atRiskItems: atRiskItems.slice(0, 5),
          userLoad,
          teamAverage,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching flow visibility data:", error);
        setData((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchFlowData();
  }, [teamCategory]);

  return data;
}
