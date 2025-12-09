import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface TargetMetric {
  id: string;
  label: string;
  current: number;
  goal: number;
  unit: string;
  trend: "up" | "down" | "flat";
  trendValue: string;
  period: string;
}

interface QuarterlyTarget {
  quarter: string;
  revenue: { current: number; goal: number };
  deals: { current: number; goal: number };
  newLogos: { current: number; goal: number };
}

const personalTargets: TargetMetric[] = [
  {
    id: "1",
    label: "Revenue",
    current: 287000,
    goal: 350000,
    unit: "$",
    trend: "up",
    trendValue: "+12%",
    period: "vs last month",
  },
  {
    id: "2",
    label: "Deals Closed",
    current: 8,
    goal: 12,
    unit: "",
    trend: "up",
    trendValue: "+2",
    period: "vs last month",
  },
  {
    id: "3",
    label: "New Logos",
    current: 3,
    goal: 5,
    unit: "",
    trend: "flat",
    trendValue: "0",
    period: "vs last month",
  },
  {
    id: "4",
    label: "Avg Deal Size",
    current: 35875,
    goal: 40000,
    unit: "$",
    trend: "down",
    trendValue: "-5%",
    period: "vs last month",
  },
];

const teamTargets: TargetMetric[] = [
  {
    id: "1",
    label: "Team Revenue",
    current: 420000,
    goal: 500000,
    unit: "$",
    trend: "up",
    trendValue: "+8%",
    period: "vs last month",
  },
  {
    id: "2",
    label: "Team Deals",
    current: 24,
    goal: 35,
    unit: "",
    trend: "up",
    trendValue: "+4",
    period: "vs last month",
  },
];

const quarterlyProgress: QuarterlyTarget[] = [
  {
    quarter: "Q4 2024",
    revenue: { current: 287000, goal: 350000 },
    deals: { current: 8, goal: 12 },
    newLogos: { current: 3, goal: 5 },
  },
];

const operationalMetrics = [
  { label: "Avg Days to Close", value: "34", target: "30", status: "warning" },
  { label: "Win Rate", value: "42%", target: "45%", status: "warning" },
  { label: "Pipeline Coverage", value: "3.2x", target: "3x", status: "success" },
  { label: "Proposals Sent", value: "14", target: "12", status: "success" },
];

function formatValue(value: number, unit: string): string {
  if (unit === "$") {
    return value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value}`;
  }
  return value.toString();
}

export default function MyTargets() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">My Targets</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Track your progress against quarterly and annual goals
        </p>
      </div>

      {/* Personal Targets Overview */}
      <div className="grid grid-cols-4 gap-4">
        {personalTargets.map((metric) => {
          const progress = (metric.current / metric.goal) * 100;
          const isOnTrack = progress >= 75;
          
          return (
            <Card key={metric.id} className="border-border">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.trend === "up" ? "text-status-success" : 
                    metric.trend === "down" ? "text-status-error" : "text-muted-foreground"
                  }`}>
                    {metric.trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                    {metric.trend === "down" && <ArrowDownRight className="h-3 w-3" />}
                    {metric.trendValue}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">
                      {formatValue(metric.current, metric.unit)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatValue(metric.goal, metric.unit)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOnTrack ? "bg-primary" : "bg-status-warning"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.period}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team vs Personal Comparison */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team Target */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-medium">Team Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamTargets.map((metric) => {
              const progress = (metric.current / metric.goal) * 100;
              return (
                <div key={metric.id} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                    <span className="text-sm font-medium">
                      {formatValue(metric.current, metric.unit)} / {formatValue(metric.goal, metric.unit)}
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Your Contribution */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base font-medium">Your Contribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Contribution</p>
                  <p className="text-2xl font-semibold">68%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">of team total</p>
                  <p className="text-sm font-medium text-status-success">Above average</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Deal Contribution</p>
                  <p className="text-2xl font-semibold">33%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">of team total</p>
                  <p className="text-sm font-medium">On track</p>
                </div>
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
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">target: {metric.target}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`mt-2 text-xs ${
                    metric.status === "success" 
                      ? "bg-status-success/10 text-status-success border-status-success/20"
                      : "bg-status-warning/10 text-status-warning border-status-warning/20"
                  }`}
                >
                  {metric.status === "success" ? "On Track" : "Needs Attention"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Progress */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-medium">Q4 2024 Progress</CardTitle>
            <Badge variant="outline" className="text-xs">6 weeks remaining</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenue</span>
                <span className="text-sm text-muted-foreground">82%</span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "82%" }} />
              </div>
              <p className="text-xs text-muted-foreground">$287K of $350K</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deals Closed</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "67%" }} />
              </div>
              <p className="text-xs text-muted-foreground">8 of 12 deals</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Logos</span>
                <span className="text-sm text-muted-foreground">60%</span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-status-warning rounded-full" style={{ width: "60%" }} />
              </div>
              <p className="text-xs text-muted-foreground">3 of 5 new customers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}