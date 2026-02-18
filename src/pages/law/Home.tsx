import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentUserRole, getTeamRolesForUser } from "@/hooks/useCurrentUserRole";
import { useUnifiedNeeds } from "@/hooks/useUnifiedNeeds";
import { useTemplates } from "@/hooks/useTemplates";
import { useClauses } from "@/hooks/useClauses";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  MetricRing,
  StatusBadge,
  VisualBreakdown,
  WorkloadHistoryMini,
  UnifiedNeedsDashboard,
} from "@/components/dashboard";

// --- Activity type → icon mapping ---
const ACTIVITY_ICONS: Record<string, typeof CheckCircle2> = {
  approval_approved: CheckCircle2,
  approval_rejected: AlertCircle,
  created: FileText,
  stage_changed: CheckCircle2,
  document_uploaded: FileText,
  default: CheckCircle2,
};

// --- Recent Activity hook (lightweight, home-page only) ---
function useRecentActivity(userId: string | undefined) {
  const [activities, setActivities] = useState<
    { id: string; action: string; item: string; time: string; iconKey: string }[]
  >([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("workstream_activity")
        .select("id, activity_type, description, created_at, workstreams(name)")
        .eq("actor_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (cancelled || !data) return;

      setActivities(
        data.map((a: any) => ({
          id: a.id,
          action: a.description,
          item: (a.workstreams as any)?.name ?? "",
          time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
          iconKey: a.activity_type,
        })),
      );
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return activities;
}

// --- Pipeline distribution hook ---
function usePipelineDistribution() {
  const [segments, setSegments] = useState<
    { label: string; value: number; color: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("workstreams")
        .select("stage");

      if (cancelled || !data) return;

      const counts: Record<string, number> = {};
      for (const w of data) {
        const stage = w.stage || "draft";
        counts[stage] = (counts[stage] || 0) + 1;
      }

      const stageColors: Record<string, string> = {
        draft: "hsl(var(--stage-draft))",
        negotiation: "hsl(var(--stage-negotiation))",
        approval: "hsl(var(--stage-approval))",
        signature: "hsl(var(--stage-signature))",
        closed: "hsl(var(--stage-closed, 200 10% 50%))",
      };

      setSegments(
        Object.entries(counts).map(([stage, value]) => ({
          label: stage.charAt(0).toUpperCase() + stage.slice(1),
          value,
          color: stageColors[stage] || "hsl(var(--muted-foreground))",
        })),
      );
    })();

    return () => { cancelled = true; };
  }, []);

  return segments;
}

export default function LawHome() {
  const { labels } = useTheme();
  const { user } = useAuth();
  const { role } = useCurrentUserRole();
  const teamRoles = getTeamRolesForUser(role);
  const effectiveTeamRoles = teamRoles.length > 0 ? teamRoles : ["legal_ops", "contract_counsel", "general_counsel"];

  const { myActions } = useUnifiedNeeds(role || "legal_ops", effectiveTeamRoles);
  const { drafts: draftTemplates, loading: templatesLoading } = useTemplates();
  const { clauses, loading: clausesLoading } = useClauses();
  const recentActivity = useRecentActivity(user?.id);
  const pipelineDistribution = usePipelineDistribution();

  // Recent clauses (most recently updated, up to 3)
  const recentClauses = clauses
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  // Engagement: ratio of completed needs to total (simple metric)
  const completedCount = myActions.totalCount > 0
    ? Math.max(0, myActions.totalCount - myActions.overdueCount)
    : 0;
  const engagementScore = myActions.totalCount > 0
    ? Math.round((completedCount / (completedCount + myActions.totalCount)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Three-Part Hero Section */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Left: MetricRing (25%) */}
        <div className="col-span-12 md:col-span-3 flex items-center justify-center">
          <MetricRing
            value={engagementScore}
            max={100}
            label={labels.engagement}
            sublabel="This month"
            size="lg"
            showValue
          />
        </div>

        <div className="col-span-12 md:col-span-6 flex flex-col justify-center">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  Good morning
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  You have{" "}
                  <span className="font-semibold text-foreground">
                    {myActions.totalCount}
                  </span>{" "}
                  items waiting for your action
                  {myActions.overdueCount > 0 && (
                    <span>
                      , including{" "}
                      <span className="text-destructive font-semibold">
                        {myActions.overdueCount} overdue
                      </span>
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <NavLink to="/law/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New {labels.matter}
                  </Button>
                </NavLink>
                <NavLink to="/law/matters">
                  <Button variant="outline">View Active {labels.matters}</Button>
                </NavLink>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: placeholder — workload history needs real time-series data */}
        <div className="col-span-12 md:col-span-3">
          <WorkloadHistoryMini data={[]} title="30-Day Workload" />
        </div>
      </div>

      {/* Unified Needs Dashboard - Kanban-style lanes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">What Needs Attention</h2>
          {pipelineDistribution.length > 0 && (
            <Card className="px-4 py-2 border-0 bg-muted/50">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">Pipeline</p>
                <VisualBreakdown segments={pipelineDistribution} className="w-32" />
              </div>
            </Card>
          )}
        </div>
        <UnifiedNeedsDashboard
          modulePrefix="law"
          userRole={role || "legal_ops"}
          teamRoles={effectiveTeamRoles}
        />
      </div>

      {/* Main Content Grid - Secondary info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Templates */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Draft Templates
                </CardTitle>
                <CardDescription>Unfinished templates in progress</CardDescription>
              </div>
              <StatusBadge
                status="neutral"
                label={String(draftTemplates.length)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {templatesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : draftTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drafts in progress</p>
            ) : (
              draftTemplates.slice(0, 3).map((draft) => (
                <NavLink key={draft.id} to={`/law/templates/${draft.id}/edit`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium text-sm">{draft.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Last modified{" "}
                        {formatDistanceToNow(new Date(draft.updated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Continue
                    </Button>
                  </div>
                </NavLink>
              ))
            )}
            <NavLink to="/law/templates">
              <Button variant="outline" className="w-full mt-2">
                View All Templates
              </Button>
            </NavLink>
          </CardContent>
        </Card>

        {/* Clauses — recently updated */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Clauses
                </CardTitle>
                <CardDescription>Recently updated in the library</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {clausesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentClauses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clauses yet</p>
            ) : (
              recentClauses.map((clause) => (
                <NavLink key={clause.id} to={`/law/clauses/${clause.id}/edit`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium text-sm">{clause.title}</p>
                      <p className="text-sm text-muted-foreground">{clause.category}</p>
                    </div>
                    <StatusBadge
                      status={clause.risk_level === "high" ? "critical" : clause.risk_level === "medium" ? "warning" : "neutral"}
                      label={clause.risk_level}
                    />
                  </div>
                </NavLink>
              ))
            )}
            <NavLink to="/law/clauses">
              <Button variant="outline" className="w-full mt-2">
                View All Clauses
              </Button>
            </NavLink>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              recentActivity.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.iconKey] || ACTIVITY_ICONS.default;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.item}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
