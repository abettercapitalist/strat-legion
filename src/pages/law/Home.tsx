import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Library, Inbox, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { FlowVisibilityWidgets } from "@/components/home/FlowVisibilityWidgets";
import { WorkloadBalance } from "@/components/home/WorkloadBalance";

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
  { id: 1, name: "Limitation of Liability", reason: "Low success rate (42%)", priority: "high" },
  { id: 2, name: "Indemnification", reason: "Frequently negotiated", priority: "medium" },
];

const recentActivity = [
  { id: 1, action: "Template published", item: "Enterprise SaaS Agreement", time: "1 hour ago", icon: CheckCircle2 },
  { id: 2, action: "Change request approved", item: "Payment Terms clause", time: "3 hours ago", icon: CheckCircle2 },
  { id: 3, action: "Clause created", item: "Data Processing Addendum", time: "Yesterday", icon: FileText },
];

// Mock data for flow visibility widgets
const waitingOnMe = [
  { id: "1", name: "Acme Corp approval", dueText: "due in 4 hrs", isOverdue: false },
  { id: "2", name: "Globex terms review", dueText: "due today", isOverdue: false },
  { id: "3", name: "Initech signature", dueText: "overdue 2 days", isOverdue: true },
];

const waitingOnOthers = [
  { role: "Finance approval", count: 2 },
  { role: "Sales Manager approval", count: 2 },
  { role: "Legal review", count: 1 },
];

const atRiskItems = [
  { id: "1", name: "Umbrella Corp", reason: "no activity 7 days" },
  { id: "2", name: "Wayne Ent", reason: "approval overdue 3 days" },
];

// Mock workload data (would be calculated from real data)
const userLoad = 35;
const teamAverage = 52;

export default function LawHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Home</h1>
        <p className="text-muted-foreground mt-1">Your daily overview and pending tasks</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-semibold text-foreground">3</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft Templates</p>
                <p className="text-3xl font-semibold text-foreground">2</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Templates</p>
                <p className="text-3xl font-semibold text-foreground">12</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clauses in Library</p>
                <p className="text-3xl font-semibold text-foreground">47</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                <Library className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow Visibility Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">Flow Visibility</h2>
        <FlowVisibilityWidgets
          modulePrefix="law"
          waitingOnMe={waitingOnMe}
          waitingOnOthers={waitingOnOthers}
          atRiskItems={atRiskItems}
        />
      </div>

      {/* Workload Balance */}
      <WorkloadBalance userLoad={userLoad} teamAverage={teamAverage} />

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
              <Badge variant="destructive">{pendingChangeRequests.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingChangeRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="font-medium text-sm">{request.template}</p>
                  <p className="text-xs text-muted-foreground">{request.type} • {request.requestedBy}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{request.date}</span>
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
              <Badge variant="secondary">{draftTemplates.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {draftTemplates.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="font-medium text-sm">{draft.name}</p>
                  <p className="text-xs text-muted-foreground">Last modified {draft.lastModified}</p>
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
                  <p className="text-xs text-muted-foreground">{clause.reason}</p>
                </div>
                <Badge variant={clause.priority === 'high' ? 'destructive' : 'secondary'}>
                  {clause.priority}
                </Badge>
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
                  <p className="text-xs text-muted-foreground">{activity.item}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
