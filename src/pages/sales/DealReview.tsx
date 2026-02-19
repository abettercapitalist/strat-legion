import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamPatternsTab } from "@/components/review/TeamPatternsTab";
import { MyPerformanceTab } from "@/components/review/MyPerformanceTab";
import { RecognitionTab } from "@/components/review/RecognitionTab";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Sales team filtering helpers (same logic as useDeals / Home)
// ---------------------------------------------------------------------------

async function getSalesTeamIds(): Promise<Set<string>> {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, parent_id");

  if (!teams) return new Set();

  const salesRoot = teams.find((t) => t.name === "sales");
  if (!salesRoot) {
    return new Set(teams.filter((t) => t.name.startsWith("sales")).map((t) => t.id));
  }

  const ids = new Set<string>([salesRoot.id]);
  for (const t of teams) {
    if (t.parent_id && ids.has(t.parent_id)) ids.add(t.id);
  }
  return ids;
}

function teamCategoryMatchesAny(raw: string | null | undefined, teamIds: Set<string>): boolean {
  if (!raw) return true;
  if (teamIds.size === 0) return false;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.some((id: string) => teamIds.has(id));
  } catch { /* not JSON */ }
  return raw.toLowerCase() === "sales";
}

// ---------------------------------------------------------------------------
// useTeamPatterns – powers the "Team Patterns" tab
// ---------------------------------------------------------------------------

function useTeamPatterns(days: number) {
  return useQuery({
    queryKey: ["deal-review-team-patterns", days],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();

      const [
        salesTeamIds,
        { data: workstreams },
        { data: approvals },
        { data: decisions },
      ] = await Promise.all([
        getSalesTeamIds(),
        supabase
          .from("workstreams")
          .select("id, stage, created_at, updated_at, workstream_type:workstream_types(name, team_category)")
          .gte("updated_at", cutoff),
        supabase
          .from("workstream_approvals")
          .select("id, workstream_id, status, submitted_at, completed_at, approval_template_id, template:approval_templates(name), workstream:workstreams(workstream_type:workstream_types(team_category))")
          .gte("created_at", cutoff),
        supabase
          .from("approval_decisions")
          .select("id, approval_id, decision, decided_by, created_at")
          .gte("created_at", cutoff),
      ]);

      // Filter to sales workstreams
      const salesWS = (workstreams || []).filter(
        (w) => teamCategoryMatchesAny(w.workstream_type?.team_category, salesTeamIds)
      );
      const salesApprovals = (approvals || []).filter(
        (a) => teamCategoryMatchesAny(a.workstream?.workstream_type?.team_category, salesTeamIds)
      );

      // --- closureByType: completed workstreams grouped by type, avg days ---
      const closedWS = salesWS.filter((w) => w.stage === "closed_won" || w.stage === "closed_lost");
      const typeMap: Record<string, { totalDays: number; count: number }> = {};
      for (const w of closedWS) {
        const typeName = w.workstream_type?.name || "Other";
        const cycleDays = (new Date(w.updated_at).getTime() - new Date(w.created_at).getTime()) / 86_400_000;
        if (!typeMap[typeName]) typeMap[typeName] = { totalDays: 0, count: 0 };
        typeMap[typeName].totalDays += cycleDays;
        typeMap[typeName].count += 1;
      }
      const closureByType = Object.entries(typeMap).map(([name, v]) => ({
        name,
        avgDays: Math.round((v.totalDays / v.count) * 10) / 10,
      }));

      // --- closureByRoute: approvals grouped by template, avg days ---
      const completedApprovals = salesApprovals.filter(
        (a) => a.completed_at && (a.status === "approved" || a.status === "rejected")
      );
      const routeMap: Record<string, { totalDays: number; count: number }> = {};
      for (const a of completedApprovals) {
        const routeName = a.template?.name || "Unknown Route";
        if (!a.submitted_at || !a.completed_at) continue;
        const days_ = (new Date(a.completed_at).getTime() - new Date(a.submitted_at).getTime()) / 86_400_000;
        if (!routeMap[routeName]) routeMap[routeName] = { totalDays: 0, count: 0 };
        routeMap[routeName].totalDays += days_;
        routeMap[routeName].count += 1;
      }
      const closureByRoute = Object.entries(routeMap).map(([name, v]) => ({
        name,
        avgDays: Math.round((v.totalDays / v.count) * 10) / 10,
      }));

      // --- avgApprovalTime (hours) ---
      let totalHours = 0;
      let approvalCount = 0;
      for (const a of completedApprovals) {
        if (!a.submitted_at || !a.completed_at) continue;
        totalHours += (new Date(a.completed_at).getTime() - new Date(a.submitted_at).getTime()) / 3_600_000;
        approvalCount += 1;
      }
      const avgApprovalTime = approvalCount > 0 ? Math.round((totalHours / approvalCount) * 10) / 10 : 0;

      // --- firstTimeApprovalRate ---
      // Group decisions by approval_id; "first time" = single decision that is "approved"
      const decisionsByApproval: Record<string, string[]> = {};
      for (const d of decisions || []) {
        if (!decisionsByApproval[d.approval_id]) decisionsByApproval[d.approval_id] = [];
        decisionsByApproval[d.approval_id].push(d.decision);
      }
      const completedApprovalIds = new Set(completedApprovals.map((a) => a.id));
      let firstTimeCount = 0;
      let totalCompleted = 0;
      for (const [approvalId, decs] of Object.entries(decisionsByApproval)) {
        if (!completedApprovalIds.has(approvalId)) continue;
        totalCompleted += 1;
        if (decs.length === 1 && decs[0] === "approved") firstTimeCount += 1;
      }
      const firstTimeApprovalRate = totalCompleted > 0 ? Math.round((firstTimeCount / totalCompleted) * 100) : 0;

      // --- approvalDelays: group by decider, calc % of total wait time ---
      const deciderIds = [...new Set((decisions || []).map((d) => d.decided_by).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (deciderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", deciderIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Unknown"]));
        }
      }

      // For each decider, sum the wait time of the approvals they decided on
      const deciderWait: Record<string, number> = {};
      let totalWait = 0;
      for (const d of decisions || []) {
        const approval = completedApprovals.find((a) => a.id === d.approval_id);
        if (!approval || !approval.submitted_at || !approval.completed_at) continue;
        const waitMs = new Date(approval.completed_at).getTime() - new Date(approval.submitted_at).getTime();
        const name = profileMap[d.decided_by] || "Unknown";
        deciderWait[name] = (deciderWait[name] || 0) + waitMs;
        totalWait += waitMs;
      }
      const approvalDelays = totalWait > 0
        ? Object.entries(deciderWait)
            .map(([role, ms]) => ({ role, percentage: Math.round((ms / totalWait) * 100) }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5)
        : [];

      // --- insights (generated from data) ---
      const insights: { type: "insight" | "warning"; title: string; description: string; suggestion?: string }[] = [];

      if (closureByType.length > 0) {
        const fastest = closureByType.reduce((a, b) => (a.avgDays < b.avgDays ? a : b));
        insights.push({
          type: "insight",
          title: `${fastest.name} closes fastest at ${fastest.avgDays} days`,
          description: `This is the quickest deal type in the last ${days} days.`,
        });
      }

      if (approvalDelays.length > 0 && approvalDelays[0].percentage > 40) {
        insights.push({
          type: "warning",
          title: `${approvalDelays[0].role} accounts for ${approvalDelays[0].percentage}% of approval wait time`,
          description: "This approver may be a bottleneck.",
          suggestion: "Consider adding backup approvers or clearer SLAs.",
        });
      }

      if (firstTimeApprovalRate < 50 && totalCompleted > 0) {
        insights.push({
          type: "warning",
          title: `First-time approval rate is only ${firstTimeApprovalRate}%`,
          description: "Many deals require multiple approval rounds.",
          suggestion: "Review common rejection reasons to improve submission quality.",
        });
      }

      return { closureByType, closureByRoute, avgApprovalTime, firstTimeApprovalRate, approvalDelays, insights };
    },
  });
}

// ---------------------------------------------------------------------------
// useMyPerformance – powers the "My Performance" tab
// ---------------------------------------------------------------------------

function useMyPerformance(days: number, userId: string | undefined) {
  return useQuery({
    queryKey: ["deal-review-my-performance", days, userId],
    enabled: !!userId,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();

      const [
        salesTeamIds,
        { data: myWorkstreams },
        { data: allWorkstreams },
        { data: myDecisions },
        { data: allDecisions },
        { data: myActivity },
      ] = await Promise.all([
        getSalesTeamIds(),
        supabase
          .from("workstreams")
          .select("id, stage, created_at, updated_at, annual_value, workstream_type:workstream_types(team_category)")
          .eq("owner_id", userId!)
          .gte("updated_at", cutoff),
        supabase
          .from("workstreams")
          .select("id, stage, owner_id, created_at, updated_at, annual_value, workstream_type:workstream_types(team_category)")
          .gte("updated_at", cutoff),
        supabase
          .from("approval_decisions")
          .select("id, approval_id, decision, created_at, approval:workstream_approvals(submitted_at, completed_at)")
          .eq("decided_by", userId!)
          .gte("created_at", cutoff),
        supabase
          .from("approval_decisions")
          .select("id, approval_id, decision, decided_by, created_at, approval:workstream_approvals(submitted_at, completed_at)")
          .gte("created_at", cutoff),
        supabase
          .from("workstream_activity")
          .select("id, activity_type, workstream_id, description")
          .eq("actor_id", userId!)
          .gte("created_at", cutoff),
      ]);

      // Filter to sales
      const mySalesWS = (myWorkstreams || []).filter(
        (w) => teamCategoryMatchesAny(w.workstream_type?.team_category, salesTeamIds)
      );
      const allSalesWS = (allWorkstreams || []).filter(
        (w) => teamCategoryMatchesAny(w.workstream_type?.team_category, salesTeamIds)
      );

      // --- personalMetrics ---
      const myClosed = mySalesWS.filter((w) => w.stage === "closed_won");
      const myTotal = mySalesWS.filter((w) => w.stage === "closed_won" || w.stage === "closed_lost");
      const closedCount = myClosed.length;

      let avgCycleDays = 0;
      if (myClosed.length > 0) {
        const totalCycle = myClosed.reduce(
          (sum, w) => sum + (new Date(w.updated_at).getTime() - new Date(w.created_at).getTime()) / 86_400_000,
          0
        );
        avgCycleDays = Math.round((totalCycle / myClosed.length) * 10) / 10;
      }

      const winRate = myTotal.length > 0 ? Math.round((myClosed.length / myTotal.length) * 100) : 0;

      const personalMetrics = [
        { label: "Deals Closed", value: String(closedCount), trend: "neutral" as const },
        { label: "Avg deal cycle", value: avgCycleDays > 0 ? `${avgCycleDays} days` : "N/A", trend: "neutral" as const },
        { label: "Win rate", value: `${winRate}%`, trend: "neutral" as const },
      ];

      // --- speed comparison: my avg approval decision speed vs team ---
      function avgDecisionHours(decs: typeof myDecisions) {
        let total = 0;
        let count = 0;
        for (const d of decs || []) {
          const appr = d.approval as { submitted_at: string | null; completed_at: string | null } | null;
          if (!appr?.submitted_at) continue;
          const hours = (new Date(d.created_at).getTime() - new Date(appr.submitted_at).getTime()) / 3_600_000;
          if (hours >= 0) { total += hours; count += 1; }
        }
        return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      }

      const mySpeed = avgDecisionHours(myDecisions);
      const teamSpeed = avgDecisionHours(allDecisions);
      const speedDiff = teamSpeed > 0 ? Math.round(((teamSpeed - mySpeed) / teamSpeed) * 100) : 0;

      const speedComparison = {
        yourSpeed: mySpeed,
        teamAverage: teamSpeed,
        percentile: Math.max(0, Math.min(100, speedDiff)),
      };

      // --- quality comparison: my first-time approval rate vs team ---
      function firstTimeRate(decs: typeof allDecisions) {
        const grouped: Record<string, string[]> = {};
        for (const d of decs || []) {
          if (!grouped[d.approval_id]) grouped[d.approval_id] = [];
          grouped[d.approval_id].push(d.decision);
        }
        let ft = 0;
        let tot = 0;
        for (const arr of Object.values(grouped)) {
          tot += 1;
          if (arr.length === 1 && arr[0] === "approved") ft += 1;
        }
        return tot > 0 ? Math.round((ft / tot) * 100) : 0;
      }

      const myQuality = firstTimeRate(myDecisions);
      const teamQuality = firstTimeRate(allDecisions);
      const qualityDiff = teamQuality > 0 ? Math.round(((myQuality - teamQuality) / teamQuality) * 100) : 0;

      const qualityComparison = {
        yourQuality: myQuality,
        teamAverage: teamQuality,
        percentile: Math.max(0, Math.min(100, qualityDiff)),
      };

      // --- teamImpact from workstream_activity ---
      const activityTypes: Record<string, number> = {};
      for (const a of myActivity || []) {
        const t = a.activity_type || "other";
        activityTypes[t] = (activityTypes[t] || 0) + 1;
      }
      const teamImpact = Object.entries(activityTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => ({
          icon: "📊",
          text: `${count} ${type.replace(/_/g, " ")} contribution${count !== 1 ? "s" : ""}`,
        }));

      if (teamImpact.length === 0) {
        teamImpact.push({ icon: "📊", text: "No recorded activity this period" });
      }

      // --- teamStats ---
      const completedApprovalSet = new Set<string>();
      let totalApprovalHours = 0;
      let approvalCnt = 0;
      for (const d of allDecisions || []) {
        const appr = d.approval as { submitted_at: string | null; completed_at: string | null } | null;
        if (!appr?.submitted_at || !appr?.completed_at) continue;
        if (completedApprovalSet.has(d.approval_id)) continue;
        completedApprovalSet.add(d.approval_id);
        const hours = (new Date(appr.completed_at).getTime() - new Date(appr.submitted_at).getTime()) / 3_600_000;
        totalApprovalHours += hours;
        approvalCnt += 1;
      }
      const avgApprovalTime = approvalCnt > 0 ? Math.round((totalApprovalHours / approvalCnt) * 10) / 10 : 0;

      const teamStats = {
        avgApprovalTime,
        previousAvgTime: avgApprovalTime, // no previous-period comparison yet
        autoApprovalRate: 0, // no auto-approval concept yet
        previousAutoRate: 0,
        teamHelps: (myActivity || []).length,
      };

      return { personalMetrics, speedComparison, qualityComparison, teamImpact, teamStats };
    },
  });
}

// ---------------------------------------------------------------------------
// useRecognitionCandidates – powers the "Recognition" tab
// ---------------------------------------------------------------------------

function useRecognitionCandidates(days: number) {
  return useQuery({
    queryKey: ["deal-review-recognition", days],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();

      const [salesTeamIds, { data: workstreams }] = await Promise.all([
        getSalesTeamIds(),
        supabase
          .from("workstreams")
          .select("id, stage, owner_id, annual_value, created_at, updated_at, workstream_type:workstream_types(team_category)")
          .gte("updated_at", cutoff),
      ]);

      const salesWS = (workstreams || []).filter(
        (w) => teamCategoryMatchesAny(w.workstream_type?.team_category, salesTeamIds)
      );

      // Group by owner
      const ownerStats: Record<string, { closed: number; total: number; value: number; avgCycle: number; cycleSum: number }> = {};
      for (const w of salesWS) {
        if (!w.owner_id) continue;
        if (!ownerStats[w.owner_id]) ownerStats[w.owner_id] = { closed: 0, total: 0, value: 0, avgCycle: 0, cycleSum: 0 };
        const s = ownerStats[w.owner_id];
        if (w.stage === "closed_won" || w.stage === "closed_lost") s.total += 1;
        if (w.stage === "closed_won") {
          s.closed += 1;
          s.value += Number(w.annual_value) || 0;
          s.cycleSum += (new Date(w.updated_at).getTime() - new Date(w.created_at).getTime()) / 86_400_000;
        }
      }

      // Fetch profile names
      const ownerIds = Object.keys(ownerStats);
      let profileMap: Record<string, string> = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Unknown"]));
        }
      }

      // Rank by closed deals, then value
      const ranked = Object.entries(ownerStats)
        .filter(([, s]) => s.closed > 0 || s.total > 0)
        .sort((a, b) => b[1].closed - a[1].closed || b[1].value - a[1].value);

      const candidates = ranked.slice(0, 5).map(([ownerId, s], idx) => {
        const winRate = s.total > 0 ? Math.round((s.closed / s.total) * 100) : 0;
        const avgCycle = s.closed > 0 ? Math.round((s.cycleSum / s.closed) * 10) / 10 : 0;
        const type: "top_performer" | "most_improved" | "breakthrough" =
          idx === 0 ? "top_performer" : idx === 1 ? "most_improved" : "breakthrough";

        return {
          id: ownerId,
          name: profileMap[ownerId] || "Unknown",
          type,
          reason: `${s.closed} deal${s.closed !== 1 ? "s" : ""} closed, ${winRate}% win rate`,
          details: [
            `Win rate: ${winRate}%`,
            `Total value: $${Math.round(s.value / 1000)}K`,
            `Avg cycle: ${avgCycle} days`,
          ],
          isRecognized: false,
        };
      });

      return candidates;
    },
  });
}

// ---------------------------------------------------------------------------
// DealReview page component
// ---------------------------------------------------------------------------

export default function DealReview() {
  const [activeTab, setActiveTab] = useState("team-patterns");
  const [timePeriod, setTimePeriod] = useState("30");
  const { user, isManager: checkIsManager } = useAuth();
  const { toast } = useToast();

  const days = Number(timePeriod);

  const { data: teamPatterns, isLoading: loadingPatterns } = useTeamPatterns(days);
  const { data: myPerformance, isLoading: loadingPerformance } = useMyPerformance(days, user?.id);
  const { data: recognitionCandidates, isLoading: loadingRecognition } = useRecognitionCandidates(days);

  const isManager = checkIsManager();

  const handleReviewDetails = (candidateId: string) => {
    toast({
      title: "Review Details",
      description: "Opening detailed performance report...",
    });
  };

  const handleRecognize = (candidateId: string) => {
    toast({
      title: "Recognition Recorded",
      description: "Team member has been recognized. Consider delivering recognition personally!",
    });
  };

  const handleDismiss = (candidateId: string) => {
    toast({
      title: "Dismissed",
      description: "Recognition opportunity dismissed for this period.",
    });
  };

  const getTimePeriodLabel = (d: string) => {
    switch (d) {
      case "7": return "Last 7 Days";
      case "30": return "Last 30 Days";
      case "90": return "Last 90 Days";
      default: return "Last 30 Days";
    }
  };

  const isLoading = loadingPatterns || loadingPerformance || loadingRecognition;

  const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Performance Review</h1>
          <p className="text-muted-foreground">
            Analyze patterns, track performance, and identify improvements
          </p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="team-patterns">Team Patterns</TabsTrigger>
            <TabsTrigger value="my-performance">My Performance</TabsTrigger>
            {isManager && <TabsTrigger value="recognition">Recognition</TabsTrigger>}
          </TabsList>

          <TabsContent value="team-patterns" className="mt-6">
            <TeamPatternsTab
              timePeriod={getTimePeriodLabel(timePeriod)}
              moduleLabel="Deal"
              closureByType={teamPatterns?.closureByType ?? []}
              closureByRoute={teamPatterns?.closureByRoute ?? []}
              avgApprovalTime={teamPatterns?.avgApprovalTime ?? 0}
              firstTimeApprovalRate={teamPatterns?.firstTimeApprovalRate ?? 0}
              approvalDelays={teamPatterns?.approvalDelays ?? []}
              insights={teamPatterns?.insights ?? []}
            />
          </TabsContent>

          <TabsContent value="my-performance" className="mt-6">
            <MyPerformanceTab
              timePeriod={getTimePeriodLabel(timePeriod)}
              personalMetrics={myPerformance?.personalMetrics ?? []}
              speedComparison={myPerformance?.speedComparison ?? { yourSpeed: 0, teamAverage: 0, percentile: 0 }}
              qualityComparison={myPerformance?.qualityComparison ?? { yourQuality: 0, teamAverage: 0, percentile: 0 }}
              teamImpact={myPerformance?.teamImpact ?? []}
              teamStats={myPerformance?.teamStats ?? { avgApprovalTime: 0, previousAvgTime: 0, autoApprovalRate: 0, previousAutoRate: 0, teamHelps: 0 }}
            />
          </TabsContent>

          {isManager && (
            <TabsContent value="recognition" className="mt-6">
              <RecognitionTab
                currentMonth={currentMonth}
                candidates={recognitionCandidates ?? []}
                recognitionStats={{
                  targetPerMonth: "2-3 per month",
                  recognizedLast3Months: 0,
                  dismissedLast3Months: 0,
                }}
                onReviewDetails={handleReviewDetails}
                onRecognize={handleRecognize}
                onDismiss={handleDismiss}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
