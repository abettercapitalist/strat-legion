import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Lightbulb, AlertTriangle, Users } from "lucide-react";

interface ClosureMetric {
  name: string;
  avgDays: number;
}

interface ApprovalDelay {
  role: string;
  percentage: number;
}

interface Insight {
  type: "insight" | "warning";
  title: string;
  description: string;
  suggestion?: string;
}

interface TeamPatternsTabProps {
  timePeriod: string;
  moduleLabel: string;
  closureByType: ClosureMetric[];
  closureByRoute: ClosureMetric[];
  avgApprovalTime: number;
  firstTimeApprovalRate: number;
  approvalDelays: ApprovalDelay[];
  insights: Insight[];
}

export function TeamPatternsTab({
  timePeriod,
  moduleLabel,
  closureByType,
  closureByRoute,
  avgApprovalTime,
  firstTimeApprovalRate,
  approvalDelays,
  insights,
}: TeamPatternsTabProps) {
  return (
    <div className="space-y-6">
      {/* Closure Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Average Time to Close
          </CardTitle>
          <CardDescription>
            How long {moduleLabel.toLowerCase()}s take to complete on average
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Type */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">By {moduleLabel} Type</h4>
              <div className="space-y-2">
                {closureByType.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">{metric.name}</span>
                    <span className="text-sm font-semibold">{metric.avgDays.toFixed(1)} days</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Route */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">By Approval Route</h4>
              <div className="space-y-2">
                {closureByRoute.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">{metric.name}</span>
                    <span className="text-sm font-semibold">{metric.avgDays.toFixed(1)} days avg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-status-success" />
            Approval Efficiency
          </CardTitle>
          <CardDescription>
            How quickly and effectively approvals are processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold">{avgApprovalTime.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Avg approval time</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold">{firstTimeApprovalRate}%</p>
              <p className="text-sm text-muted-foreground">First-time approvals</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold">{100 - firstTimeApprovalRate}%</p>
              <p className="text-sm text-muted-foreground">Requiring changes</p>
            </div>
          </div>

          {/* Approval Delays */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Most common approval delays</h4>
            <div className="space-y-2">
              {approvalDelays.map((delay) => (
                <div key={delay.role} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Waiting on {delay.role}</span>
                  <Badge variant="secondary">{delay.percentage}% of delays</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights & Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-status-warning" />
            Insights & Opportunities
          </CardTitle>
          <CardDescription>
            Patterns worth exploring based on recent activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No significant patterns detected in the selected time period.
            </p>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === "warning"
                    ? "border-status-warning/30 bg-status-warning/5"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.type === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-status-warning mt-0.5" />
                  ) : (
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.suggestion && (
                      <p className="text-sm text-primary font-medium mt-2">→ {insight.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
