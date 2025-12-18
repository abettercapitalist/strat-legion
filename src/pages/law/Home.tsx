import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Library, Inbox, Clock, AlertCircle, CheckCircle2, ArrowRight, Plus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useFlowVisibility } from "@/hooks/useFlowVisibility";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  MetricRing, 
  SummaryCard, 
  ActionCard, 
  StatusBadge, 
  VisualBreakdown,
  WorkloadHistoryMini 
} from "@/components/dashboard";

// Mock data for tasks and reminders
const pendingChangeRequests = [
  { id: 1, template: "SaaS Agreement", requestedBy: "Sales", date: "Dec 2, 2024", type: "Clause modification" },
  { id: 2, template: "NDA - Mutual", requestedBy: "Sales", date: "Dec 1, 2024", type: "New alternative" },
  { id: 3, template: "Services Agreement", requestedBy: "Finance", date: "Nov 30, 2024", type: "Term change" },
];

const draftTemplates = [
  { id: 1, name: "Untitled Draft - Dec 03 2024", lastModified: "2 hours ago" },
  { id: 2, name: "Partnership Agreement v2", lastModified: "Yesterday" },
];

const clausesNeedingReview = [
  { id: 1, name: "Limitation of Liability", reason: "Low success rate (42%)", priority: "high" as const },
  { id: 2, name: "Indemnification", reason: "Frequently negotiated", priority: "medium" as const },
];

const recentActivity = [
  { id: 1, action: "Template published", item: "Enterprise SaaS Agreement", time: "1 hour ago", icon: CheckCircle2 },
  { id: 2, action: "Change request approved", item: "Payment Terms clause", time: "3 hours ago", icon: CheckCircle2 },
  { id: 3, action: "Clause created", item: "Data Processing Addendum", time: "Yesterday", icon: FileText },
];

// Mock workload history data (last 30 days)
const workloadHistory = [
  { date: "Nov 18", userLoad: 45, teamLoad: 52 },
  { date: "Nov 19", userLoad: 52, teamLoad: 55 },
  { date: "Nov 20", userLoad: 48, teamLoad: 51 },
  { date: "Nov 21", userLoad: 55, teamLoad: 54 },
  { date: "Nov 22", userLoad: 62, teamLoad: 58 },
  { date: "Nov 23", userLoad: 58, teamLoad: 56 },
  { date: "Nov 24", userLoad: 45, teamLoad: 48 },
  { date: "Nov 25", userLoad: 42, teamLoad: 50 },
  { date: "Nov 26", userLoad: 65, teamLoad: 55 },
  { date: "Nov 27", userLoad: 70, teamLoad: 60 },
  { date: "Nov 28", userLoad: 68, teamLoad: 62 },
  { date: "Nov 29", userLoad: 72, teamLoad: 65 },
  { date: "Nov 30", userLoad: 65, teamLoad: 63 },
  { date: "Dec 1", userLoad: 58, teamLoad: 60 },
  { date: "Dec 2", userLoad: 55, teamLoad: 58 },
  { date: "Dec 3", userLoad: 60, teamLoad: 55 },
];

// Mock pipeline distribution
const pipelineDistribution = [
  { label: "Draft", value: 3, color: "hsl(var(--stage-draft))" },
  { label: "Negotiation", value: 5, color: "hsl(var(--stage-negotiation))" },
  { label: "Approval", value: 2, color: "hsl(var(--stage-approval))" },
  { label: "Signature", value: 1, color: "hsl(var(--stage-signature))" },
];

export default function LawHome() {
  const { waitingOnMe, waitingOnOthers, atRiskItems, userLoad, teamAverage, isLoading } = useFlowVisibility("law");
  const { labels } = useTheme();

  // Calculate engagement percentage (mock: based on completed vs pending)
  const engagementScore = 72;
  
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
                  You have <span className="font-semibold text-foreground">{waitingOnMe.length}</span> items waiting for your action
                  {atRiskItems.length > 0 && (
                    <span>, including <span className="text-destructive font-semibold">{atRiskItems.length} at risk</span></span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-3">
                <NavLink to="/law/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New {labels.workstream}
                  </Button>
                </NavLink>
                <NavLink to="/law/matters">
                  <Button variant="outline">
                    View Active {labels.matters}
                  </Button>
                </NavLink>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: WorkloadHistoryMini (30%) */}
        <div className="col-span-12 md:col-span-3">
          <WorkloadHistoryMini 
            data={workloadHistory} 
            title="30-Day Workload"
          />
        </div>
      </div>

      {/* Flow Visibility - Compact Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Waiting on Me"
          value={waitingOnMe.length}
          trend={{ value: "+2", direction: "up" }}
        />
        <SummaryCard
          title="Waiting on Others"
          value={waitingOnOthers.length}
        />
        <SummaryCard
          title="At Risk"
          value={atRiskItems.length}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Pipeline Distribution</p>
            <VisualBreakdown segments={pipelineDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Priority Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingChangeRequests.slice(0, 3).map((request) => (
            <ActionCard
              key={request.id}
              title={request.template}
              subtitle={`${request.type} • ${request.requestedBy}`}
              urgency={request.id === 1 ? "high" : "medium"}
              actionLabel="Review"
              metadata={request.date}
              onAction={() => console.log("Navigate to request", request.id)}
            />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Change Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Pending Change Requests
                </CardTitle>
                <CardDescription>Requests awaiting your review</CardDescription>
              </div>
              <StatusBadge 
                status="warning" 
                label={String(pendingChangeRequests.length)} 
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingChangeRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="font-medium text-sm">{request.template}</p>
                  <p className="text-sm text-muted-foreground">{request.type} • {request.requestedBy}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{request.date}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
            <NavLink to="/law/requests">
              <Button variant="outline" className="w-full mt-2">
                View All Requests
              </Button>
            </NavLink>
          </CardContent>
        </Card>

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
            {draftTemplates.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="font-medium text-sm">{draft.name}</p>
                  <p className="text-sm text-muted-foreground">Last modified {draft.lastModified}</p>
                </div>
                <Button variant="ghost" size="sm">
                  Continue
                </Button>
              </div>
            ))}
            <NavLink to="/law/templates">
              <Button variant="outline" className="w-full mt-2">
                View All Templates
              </Button>
            </NavLink>
          </CardContent>
        </Card>

        {/* Clauses Needing Attention */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Clauses Needing Attention
                </CardTitle>
                <CardDescription>Based on negotiation patterns</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {clausesNeedingReview.map((clause) => (
              <div key={clause.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="font-medium text-sm">{clause.name}</p>
                  <p className="text-sm text-muted-foreground">{clause.reason}</p>
                </div>
                <StatusBadge 
                  status={clause.priority === 'high' ? 'critical' : 'warning'} 
                  label={clause.priority} 
                />
              </div>
            ))}
            <NavLink to="/law/dashboard">
              <Button variant="outline" className="w-full mt-2">
                View Learning Dashboard
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
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <activity.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.item}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
