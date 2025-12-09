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
  CheckCircle2,
  Target
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
  Tooltip
} from "recharts";

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

// Pipeline distribution data for donut chart
const pipelineData = [
  { name: "Draft", value: 45, color: "hsl(var(--muted-foreground))" },
  { name: "Negotiation", value: 119, color: "hsl(var(--status-warning))" },
  { name: "Approval", value: 85, color: "hsl(var(--primary))" },
  { name: "Signature", value: 38, color: "hsl(var(--status-success))" },
];

// Weekly activity trend
const activityTrend = [
  { day: "Mon", deals: 2, tasks: 4 },
  { day: "Tue", deals: 3, tasks: 6 },
  { day: "Wed", deals: 2, tasks: 3 },
  { day: "Thu", deals: 4, tasks: 7 },
  { day: "Fri", deals: 5, tasks: 5 },
  { day: "Today", deals: 3, tasks: 4 },
];

// Target progress
const targetProgress = {
  personal: { current: 287, goal: 350, label: "Your Target" },
  team: { current: 420, goal: 500, label: "Team Target" },
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

// Custom tooltip for area chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {payload[0].value} deals active
        </p>
      </div>
    );
  }
  return null;
};

export default function SalesHome() {
  const totalPipeline = pipelineData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Welcome back, John</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Here's what needs your attention today
        </p>
      </div>

      {/* Hero Visualization Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Pipeline Donut - Main Visual */}
        <Card className="col-span-5 border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold">${totalPipeline}K</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
              {/* Legend */}
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
          </CardContent>
        </Card>

        {/* Activity Trend */}
        <Card className="col-span-4 border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              This Week's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrend}>
                  <defs>
                    <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="deals"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDeals)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Target Progress */}
        <div className="col-span-3 space-y-4">
          {/* Team Target */}
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Team Target</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-semibold">${targetProgress.team.current}K</span>
                  <span className="text-sm text-muted-foreground">of ${targetProgress.team.goal}K</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(targetProgress.team.current / targetProgress.team.goal) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Target */}
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Your Target</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-semibold">${targetProgress.personal.current}K</span>
                  <span className="text-sm text-muted-foreground">of ${targetProgress.personal.goal}K</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(targetProgress.personal.current / targetProgress.personal.goal) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Priority Tasks */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-error/10">
                <AlertCircle className="h-4 w-4 text-status-error" />
              </div>
              <CardTitle className="text-lg font-medium">Priority Actions</CardTitle>
              <Badge variant="outline" className="bg-status-error/10 text-status-error border-status-error/20">
                {priorityTasks.filter(t => t.urgency === "high").length} urgent
              </Badge>
            </div>
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
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-full ${getUrgencyStyles(task.urgency)}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{task.title}</p>
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-4 gap-4">
        <Link to="/sales/deals">
          <Card className="border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full group">
            <CardContent className="pt-6">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">My Deals</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your active deals
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
