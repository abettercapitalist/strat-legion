import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap, Users, Award, Sparkles } from "lucide-react";

interface PerformanceMetric {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

interface TeamImpact {
  icon: string;
  text: string;
}

interface MyPerformanceTabProps {
  timePeriod: string;
  personalMetrics: PerformanceMetric[];
  speedComparison: {
    yourSpeed: number;
    teamAverage: number;
    percentile: number;
  };
  qualityComparison: {
    yourQuality: number;
    teamAverage: number;
    percentile: number;
  };
  teamImpact: TeamImpact[];
  topInsight?: {
    text: string;
    usageCount: number;
  };
  teamStats: {
    avgApprovalTime: number;
    previousAvgTime: number;
    autoApprovalRate: number;
    previousAutoRate: number;
    teamHelps: number;
  };
}

export function MyPerformanceTab({
  timePeriod,
  personalMetrics,
  speedComparison,
  qualityComparison,
  teamImpact,
  topInsight,
  teamStats,
}: MyPerformanceTabProps) {
  const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-status-success" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-status-error" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Your Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Your Numbers
          </CardTitle>
          <CardDescription>
            Personal metrics for {timePeriod.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {personalMetrics.map((metric) => (
              <div key={metric.label} className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold flex items-center gap-2">
                  {metric.value}
                  {getTrendIcon(metric.trend)}
                </p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                {metric.change && (
                  <p className={`text-xs mt-1 ${metric.trend === "up" ? "text-status-success" : metric.trend === "down" ? "text-status-error" : "text-muted-foreground"}`}>
                    {metric.change}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Speed & Quality Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speed */}
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your approval speed</span>
                <span className="text-lg font-semibold">{speedComparison.yourSpeed}h</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Team average</span>
                <span className="text-sm">{speedComparison.teamAverage}h</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${100 - speedComparison.percentile}%` }}
                />
              </div>
              <p className={`text-sm ${speedComparison.yourSpeed === 0 && speedComparison.teamAverage === 0 ? "text-muted-foreground" : "text-primary"}`}>
                → {speedComparison.yourSpeed === 0 && speedComparison.teamAverage === 0
                  ? "No approvals processed yet this period"
                  : `You're helping the team maintain a ${speedComparison.teamAverage}h average`}
              </p>
            </div>

            {/* Quality */}
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Decision quality</span>
                <span className="text-lg font-semibold">{qualityComparison.yourQuality}%</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Team average</span>
                <span className="text-sm">{qualityComparison.teamAverage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-success rounded-full"
                  style={{ width: `${qualityComparison.yourQuality}%` }}
                />
              </div>
              <p className={`text-sm ${qualityComparison.yourQuality === 0 && qualityComparison.teamAverage === 0 ? "text-muted-foreground" : "text-status-success"}`}>
                → {qualityComparison.yourQuality === 0 && qualityComparison.teamAverage === 0
                  ? "No decisions recorded yet this period"
                  : `You're contributing to the team's ${qualityComparison.teamAverage}% approval rate`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Impact on Team */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-status-warning" />
            Your Impact on Team
          </CardTitle>
          <CardDescription>
            How your work has helped teammates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {teamImpact.map((impact, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-lg">{impact.icon}</span>
                <span className="text-sm">{impact.text}</span>
              </div>
            ))}
          </div>

          {topInsight && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-sm font-medium mb-2">Top insight shared:</p>
              <p className="text-sm text-muted-foreground italic">"{topInsight.text}"</p>
              <p className="text-sm text-primary mt-2">→ Used by team {topInsight.usageCount} times this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rowing Together */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Rowing Together
          </CardTitle>
          <CardDescription>
            Team context - how we're improving together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 space-y-3">
            <p className="font-medium">
              {teamStats.avgApprovalTime < teamStats.previousAvgTime
                ? "Team performance is improving:"
                : teamStats.avgApprovalTime > teamStats.previousAvgTime
                  ? "Team performance needs attention:"
                  : "Team performance snapshot:"}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                Avg approval time: {teamStats.avgApprovalTime}h
                {teamStats.previousAvgTime > 0 && teamStats.avgApprovalTime !== teamStats.previousAvgTime && (
                  <Badge variant="secondary" className={teamStats.avgApprovalTime < teamStats.previousAvgTime ? "text-status-success" : "text-status-error"}>
                    {teamStats.avgApprovalTime < teamStats.previousAvgTime ? "↓" : "↑"} from {teamStats.previousAvgTime}h last month
                  </Badge>
                )}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                Auto-approval rate: {teamStats.autoApprovalRate}%
                {teamStats.previousAutoRate > 0 && teamStats.autoApprovalRate !== teamStats.previousAutoRate && (
                  <Badge variant="secondary" className={teamStats.autoApprovalRate > teamStats.previousAutoRate ? "text-status-success" : "text-status-error"}>
                    {teamStats.autoApprovalRate > teamStats.previousAutoRate ? "↑" : "↓"} from {teamStats.previousAutoRate}%
                  </Badge>
                )}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                Team helped each other {teamStats.teamHelps} times
              </li>
            </ul>
          </div>
          {teamStats.teamHelps > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-status-warning" />
              {teamStats.avgApprovalTime < teamStats.previousAvgTime
                ? "Your contributions helped the team get faster."
                : teamStats.teamHelps >= 10
                  ? `You've been active — ${teamStats.teamHelps} contributions this period.`
                  : `You contributed ${teamStats.teamHelps} time${teamStats.teamHelps !== 1 ? "s" : ""} this period.`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
