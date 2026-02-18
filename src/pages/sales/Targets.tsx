import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Users,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

function formatValue(value: number, unit: string): string {
  if (unit === "$") {
    return value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value}`;
  }
  return value.toString();
}

interface TargetMetrics {
  totalRevenue: number;
  totalDeals: number;
  closedDeals: number;
  newLogos: number;
  avgDealSize: number;
  avgDaysToClose: number;
  winRate: number;
  pipelineCoverage: number;
}

function useTargetMetrics() {
  return useQuery({
    queryKey: ["sales-target-metrics"],
    queryFn: async () => {
      const { data: workstreams, error } = await supabase
        .from("workstreams")
        .select(`
          id, name, annual_value, status, created_at, updated_at,
          counterparty:counterparties(id, name, relationship_status),
          workstream_type:workstream_types(team_category)
        `);

      if (error) throw error;

      const all = workstreams ?? [];

      // All sales workstreams (unfiltered for now since team filtering is complex)
      const active = all.filter((w) => w.status !== "cancelled");
      const closed = all.filter((w) => w.status === "completed");
      const inProgress = all.filter((w) => w.status !== "completed" && w.status !== "cancelled");

      const totalRevenue = active.reduce((sum, w) => sum + (w.annual_value ?? 0), 0);
      const closedRevenue = closed.reduce((sum, w) => sum + (w.annual_value ?? 0), 0);

      // New logos = unique counterparties with status "prospect" or no closed deals
      const counterpartyIds = new Set(
        inProgress.filter((w) => w.counterparty?.relationship_status === "prospect").map((w) => w.counterparty?.id)
      );

      // Avg days to close for completed deals
      const closeDays = closed.map((w) => {
        const created = new Date(w.created_at).getTime();
        const updated = new Date(w.updated_at).getTime();
        return Math.floor((updated - created) / (1000 * 60 * 60 * 24));
      });
      const avgDaysToClose = closeDays.length > 0
        ? Math.round(closeDays.reduce((a, b) => a + b, 0) / closeDays.length)
        : 0;

      const totalDeals = active.length;
      const winRate = totalDeals > 0 ? Math.round((closed.length / totalDeals) * 100) : 0;

      return {
        totalRevenue,
        closedRevenue,
        totalDeals,
        closedDeals: closed.length,
        activeDeals: inProgress.length,
        newLogos: counterpartyIds.size,
        avgDealSize: closed.length > 0 ? Math.round(closedRevenue / closed.length) : (totalRevenue > 0 ? Math.round(totalRevenue / totalDeals) : 0),
        avgDaysToClose,
        winRate,
        pipelineCoverage: totalRevenue > 0 ? (totalRevenue / Math.max(closedRevenue, 1)).toFixed(1) : "0",
      };
    },
  });
}

export default function MyTargets() {
  const { data: metrics, isLoading } = useTargetMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics) return null;

  const personalTargets = [
    {
      id: "1",
      label: "Pipeline Revenue",
      current: metrics.totalRevenue,
      unit: "$",
      description: "Total value of active pipeline",
    },
    {
      id: "2",
      label: "Deals Closed",
      current: metrics.closedDeals,
      unit: "",
      description: `${metrics.activeDeals} still in progress`,
    },
    {
      id: "3",
      label: "New Logos",
      current: metrics.newLogos,
      unit: "",
      description: "Prospect counterparties",
    },
    {
      id: "4",
      label: "Avg Deal Size",
      current: metrics.avgDealSize,
      unit: "$",
      description: "Across all deals",
    },
  ];

  const operationalMetrics = [
    {
      label: "Avg Days to Close",
      value: metrics.avgDaysToClose > 0 ? `${metrics.avgDaysToClose}` : "—",
      description: "Completed deals",
    },
    {
      label: "Win Rate",
      value: `${metrics.winRate}%`,
      description: "Closed / Total",
    },
    {
      label: "Pipeline Coverage",
      value: `${metrics.pipelineCoverage}x`,
      description: "Pipeline / Closed",
    },
    {
      label: "Active Deals",
      value: `${metrics.activeDeals}`,
      description: "In progress",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">My Targets</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Track your progress against goals
        </p>
      </div>

      {/* Personal Targets Overview */}
      <div className="grid grid-cols-4 gap-4">
        {personalTargets.map((metric) => (
          <Card key={metric.id} className="border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {formatValue(metric.current, metric.unit)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline Summary */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base font-medium">Pipeline Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                <p className="text-2xl font-semibold">{formatValue(metrics.totalRevenue, "$")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{metrics.totalDeals} deals</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Closed Revenue</p>
                <p className="text-2xl font-semibold">{formatValue(metrics.closedRevenue, "$")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{metrics.closedDeals} deals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Activity */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-medium">Deal Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-semibold">{metrics.activeDeals}</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  In Progress
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Closed Won</p>
                  <p className="text-2xl font-semibold">{metrics.closedDeals}</p>
                </div>
                <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Metrics */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-medium">Operational Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {operationalMetrics.map((metric, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                <span className="text-2xl font-semibold">{metric.value}</span>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
