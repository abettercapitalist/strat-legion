import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  FileText,
  Users,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { UnifiedNeedsDashboard } from "@/components/dashboard";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserRole, getTeamRolesForUser } from "@/hooks/useCurrentUserRole";
import { supabase } from "@/integrations/supabase/client";

// --- Resolve sales team IDs for filtering ---
function useSalesTeamIds() {
  const [teamIds, setTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name, parent_id");

      if (cancelled || !teams) return;

      const salesRoot = teams.find((t) => t.name === "sales");
      if (!salesRoot) {
        setTeamIds(new Set(teams.filter((t) => t.name.startsWith("sales")).map((t) => t.id)));
        return;
      }

      const ids = new Set<string>([salesRoot.id]);
      for (const t of teams) {
        if (t.parent_id && ids.has(t.parent_id)) ids.add(t.id);
      }
      setTeamIds(ids);
    })();

    return () => { cancelled = true; };
  }, []);

  return teamIds;
}

function teamCategoryMatchesAny(raw: string | null | undefined, teamIds: Set<string>): boolean {
  // Untagged workstream types are visible in all modules
  if (!raw) return true;
  if (teamIds.size === 0) return false;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.some((id: string) => teamIds.has(id));
  } catch { /* not JSON */ }
  return raw.toLowerCase() === "sales";
}

// --- Pipeline data from workstreams ---
function useSalesPipeline() {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
  const salesTeamIds = useSalesTeamIds();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: workstreams } = await supabase
        .from("workstreams")
        .select("stage, annual_value, workstream_type:workstream_types(team_category)");

      if (cancelled || !workstreams) return;

      const stages: Record<string, number> = {};
      for (const w of workstreams) {
        if (!teamCategoryMatchesAny((w as any).workstream_type?.team_category, salesTeamIds)) continue;
        const stage = w.stage || "draft";
        stages[stage] = (stages[stage] || 0) + (Number(w.annual_value) || 0);
      }

      const stageColors: Record<string, string> = {
        draft: "hsl(var(--muted-foreground))",
        negotiation: "hsl(var(--status-warning))",
        approval: "hsl(var(--primary))",
        signature: "hsl(var(--status-success))",
        closed: "hsl(var(--muted-foreground))",
      };

      setData(
        Object.entries(stages).map(([stage, value]) => ({
          name: stage.charAt(0).toUpperCase() + stage.slice(1),
          value: Math.round(value / 1000),
          color: stageColors[stage] || "hsl(var(--muted-foreground))",
        })),
      );
    })();

    return () => { cancelled = true; };
  }, [salesTeamIds]);

  return data;
}

// --- Weekly activity from workstream_activity ---
function useWeeklyActivity() {
  const [data, setData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const { data: activity } = await supabase
        .from("workstream_activity")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (cancelled || !activity) return;

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts: Record<string, number> = {};

      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = i === 0 ? "Today" : days[d.getDay()];
        counts[label] = 0;
      }

      for (const a of activity) {
        const d = new Date(a.created_at);
        const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
        const label = daysAgo === 0 ? "Today" : days[d.getDay()];
        if (label in counts) counts[label]++;
      }

      setData(Object.entries(counts).map(([day, count]) => ({ day, count })));
    })();

    return () => { cancelled = true; };
  }, []);

  return data;
}

// --- Target progress from workstreams annual_value (sales only) ---
function useTargetProgress() {
  const [total, setTotal] = useState(0);
  const salesTeamIds = useSalesTeamIds();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("workstreams")
        .select("annual_value, workstream_type:workstream_types(team_category)");

      if (cancelled || !data) return;

      const sum = data
        .filter((w) => teamCategoryMatchesAny((w as any).workstream_type?.team_category, salesTeamIds))
        .reduce((acc, w) => acc + (Number(w.annual_value) || 0), 0);
      setTotal(Math.round(sum / 1000));
    })();

    return () => { cancelled = true; };
  }, [salesTeamIds]);

  return total;
}

// --- User profile name ---
function useProfileName() {
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setName(data?.full_name || null);
    })();

    return () => { cancelled = true; };
  }, [user]);

  return name;
}

// Custom tooltip for area chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {payload[0].value} activities
        </p>
      </div>
    );
  }
  return null;
};

export default function SalesHome() {
  const { labels } = useTheme();
  const { role } = useCurrentUserRole();
  const teamRoles = getTeamRolesForUser(role);
  const effectiveTeamRoles = teamRoles.length > 0 ? teamRoles : ["account_executive", "sales_manager", "finance_reviewer"];

  const profileName = useProfileName();
  const pipelineData = useSalesPipeline();
  const activityTrend = useWeeklyActivity();
  const totalPipelineK = useTargetProgress();

  const totalPipeline = pipelineData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome back{profileName ? `, ${profileName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Here's what needs your attention today
        </p>
      </div>

      {/* Hero Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pipeline Donut */}
        <Card className="lg:col-span-5 border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No deals in pipeline</p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold">${totalPipeline}K</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {pipelineData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">${item.value}K</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Trend */}
        <Card className="lg:col-span-4 border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              This Week's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No activity this week</p>
            ) : (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTrend}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActivity)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Total */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Total Pipeline</span>
              </div>
              <div className="space-y-2">
                <span className="text-2xl font-semibold">${totalPipelineK}K</span>
                <p className="text-sm text-muted-foreground">Across all stages</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Active {labels.deals}</span>
              </div>
              <div className="space-y-2">
                <span className="text-2xl font-semibold">
                  {pipelineData.reduce((acc, d) => acc + (d.name !== "Closed" ? 1 : 0), 0)} stages
                </span>
                <p className="text-sm text-muted-foreground">With deals in progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Needs Dashboard */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">Your Needs Dashboard</h2>
        <UnifiedNeedsDashboard
          modulePrefix="sales"
          userRole={role || "account_executive"}
          teamRoles={effectiveTeamRoles}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/sales/deals">
          <Card className="border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full group">
            <CardContent className="pt-6">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">My {labels.deals}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your active {labels.deals.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/sales/customers">
          <Card className="border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full group">
            <CardContent className="pt-6">
              <div className="p-3 rounded-lg bg-muted w-fit mb-4 group-hover:bg-muted/80 transition-colors">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">My Customers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customer relationships and history
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/sales/targets">
          <Card className="border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full group">
            <CardContent className="pt-6">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">My Targets</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your quarterly progress
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/sales/approvals">
          <Card className="border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full group">
            <CardContent className="pt-6">
              <div className="p-3 rounded-lg bg-status-warning/10 w-fit mb-4 group-hover:bg-status-warning/20 transition-colors">
                <Clock className="h-5 w-5 text-status-warning" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">Approvals</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track pending approvals and requests
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
