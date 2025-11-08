import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Plus } from "lucide-react";

const tasks = [
  {
    id: "1",
    stage: "Business Validation",
    stageColor: "stage-business",
    title: "Define expected outcomes for New Customer",
    contract: "Acme Corp Enterprise Deal",
    assignee: "Unassigned",
    due: "Today",
    priority: "High",
    status: "To Do",
  },
  {
    id: "2",
    stage: "Business Validation",
    stageColor: "stage-business",
    title: "Validate business case for Market Entry deal",
    contract: "APAC Distributor Agreement",
    assignee: "You",
    due: "Tomorrow",
    priority: "Medium",
    status: "To Do",
  },
  {
    id: "3",
    stage: "Commercial Review",
    stageColor: "stage-commercial",
    title: "Review pricing structure for TechVendor Partnership",
    contract: "TechVendor Partnership",
    assignee: "Finance Team",
    due: "2 days",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "4",
    stage: "Commercial Review",
    stageColor: "stage-commercial",
    title: "Approve territory terms for APAC Distributor",
    contract: "APAC Distributor Agreement",
    assignee: "Commercial Lead",
    due: "3 days",
    priority: "Medium",
    status: "To Do",
  },
  {
    id: "5",
    stage: "Financial Review",
    stageColor: "stage-financial",
    title: "Review cash flow impact of quarterly payments",
    contract: "CloudHost Infrastructure",
    assignee: "CFO",
    due: "Today",
    priority: "High",
    status: "To Do",
  },
  {
    id: "6",
    stage: "Negotiation",
    stageColor: "stage-negotiation",
    title: "Respond to counter-proposal from CloudHost",
    contract: "CloudHost Infrastructure",
    assignee: "You",
    due: "Today",
    priority: "High",
    status: "In Progress",
    note: "3 concessions requested - review business impact",
  },
  {
    id: "7",
    stage: "Execution",
    stageColor: "stage-execution",
    title: "Follow up on pending signatures - Acme Corp",
    contract: "Acme Corp Enterprise Deal",
    assignee: "You",
    due: "Daily",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "8",
    stage: "Performance",
    stageColor: "stage-performance",
    title: "Q1 business review - Existing Customer A",
    contract: "Customer A Subscription",
    assignee: "Account Manager",
    due: "Today",
    priority: "High",
    status: "To Do",
  },
];

export default function Tasks() {
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.stage]) {
      acc[task.stage] = [];
    }
    acc[task.stage].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">My Tasks</h1>
          <p className="text-lg text-muted-foreground mt-2">Organized by workflow stage</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">All</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">My Tasks</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">Team Tasks</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">Overdue</Button>
      </div>

      {Object.entries(groupedTasks).map(([stage, stageTasks]) => (
        <div key={stage} className="space-y-4">
          <h2 className="text-xl font-semibold uppercase text-muted-foreground text-sm tracking-wide">
            {stage} ({stageTasks.length})
          </h2>
          <div className="space-y-3">
            {stageTasks.map((task) => (
              <Card key={task.id} className="border border-border hover:border-muted-foreground/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant="outline"
                          className="mt-0.5 bg-muted text-muted-foreground border-border"
                        >
                          {task.stage}
                        </Badge>
                        <div className="flex-1">
                          <h3 className="font-medium text-base leading-snug mb-1">{task.title}</h3>
                          <p className="text-sm text-muted-foreground">{task.contract}</p>
                          {task.note && (
                            <p className="text-sm text-foreground mt-2 bg-muted px-3 py-2 rounded-md inline-block">
                              {task.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-1">
                        <div className="text-sm text-muted-foreground">Assignee</div>
                        <div className="text-sm font-medium">{task.assignee}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm text-muted-foreground">Due</div>
                        <div className={`text-sm font-medium ${
                          task.due === "Today" ? "text-destructive" : ""
                        }`}>
                          {task.due}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm text-muted-foreground">Priority</div>
                        <div className={`text-sm font-medium ${
                          task.priority === "High" ? "text-destructive" : ""
                        }`}>
                          {task.priority}
                        </div>
                      </div>
                      <div className="w-32">
                        <Select defaultValue={task.status}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To Do">To Do</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
