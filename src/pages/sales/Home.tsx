import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  FileText, 
  Users,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

interface PriorityTask {
  id: string;
  title: string;
  dealName: string;
  dealValue: string;
  dueDate: string;
  type: "approval" | "action" | "followup";
  urgency: "high" | "medium" | "low";
  route: string;
}

const priorityTasks: PriorityTask[] = [
  {
    id: "1",
    title: "Manager approval needed",
    dealName: "Meridian Software",
    dealValue: "$85K ARR",
    dueDate: "Today",
    type: "approval",
    urgency: "high",
    route: "/sales/approvals",
  },
  {
    id: "2",
    title: "Send revised proposal",
    dealName: "Cascade Analytics",
    dealValue: "$62K ARR",
    dueDate: "Tomorrow",
    type: "action",
    urgency: "high",
    route: "/sales/deals",
  },
  {
    id: "3",
    title: "Schedule renewal call",
    dealName: "Northwind Traders",
    dealValue: "$45K ARR",
    dueDate: "This week",
    type: "followup",
    urgency: "medium",
    route: "/sales/deals",
  },
];

const quickStats = {
  openDeals: 5,
  pendingApprovals: 2,
  closingThisMonth: 3,
  totalPipelineValue: "$287K",
};

function getUrgencyStyles(urgency: string) {
  switch (urgency) {
    case "high":
      return "bg-status-error/10 text-status-error border-status-error/20";
    case "medium":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "approval":
      return <Clock className="h-4 w-4" />;
    case "action":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <CheckCircle2 className="h-4 w-4" />;
  }
}

export default function SalesHome() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold">Welcome back, John</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Here's what needs your attention today
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Deals</p>
                <p className="text-3xl font-semibold mt-1">{quickStats.openDeals}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-3xl font-semibold mt-1">{quickStats.pendingApprovals}</p>
              </div>
              <Clock className="h-8 w-8 text-status-warning/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closing This Month</p>
                <p className="text-3xl font-semibold mt-1">{quickStats.closingThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-status-success/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-3xl font-semibold mt-1">{quickStats.totalPipelineValue}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Tasks */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-medium">Priority Actions</CardTitle>
            <Link to="/sales/approvals">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {priorityTasks.map((task) => (
            <Link key={task.id} to={task.route}>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${getUrgencyStyles(task.urgency)}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.dealName} · {task.dealValue}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="outline" 
                    className={getUrgencyStyles(task.urgency)}
                  >
                    {task.dueDate}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        <Link to="/sales/deals">
          <Card className="border-border hover:bg-muted/30 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <FileText className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium">My Deals</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your active deals
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/sales/customers">
          <Card className="border-border hover:bg-muted/30 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <Users className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium">My Customers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customer relationships and history
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/sales/approvals">
          <Card className="border-border hover:bg-muted/30 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <Clock className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium">Approvals</h3>
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
