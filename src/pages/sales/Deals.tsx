import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Plus, 
  ChevronDown, 
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  Target,
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Deal {
  id: string;
  title: string;
  customer: string;
  customerType: "new" | "renewal";
  arr: string;
  arrValue: number;
  stage: "Draft" | "Negotiation" | "Approval" | "Signature";
  expectedClose: string;
  nextAction: string;
  statusDetail: string;
  priority: "high" | "medium" | "low";
  daysInStage: number;
  keyTerms?: string;
  businessObjective?: string;
}

interface ApprovalTask {
  id: string;
  dealName: string;
  customer: string;
  type: string;
  dueDate: string;
  urgency: "high" | "medium" | "low";
}

const deals: Deal[] = [
  {
    id: "1",
    title: "Enterprise SaaS Agreement",
    customer: "Meridian Software",
    customerType: "new",
    arr: "$85K",
    arrValue: 85000,
    stage: "Approval",
    expectedClose: "Dec 15, 2024",
    nextAction: "Awaiting manager approval",
    statusDetail: "Submitted for approval 2 days ago. Manager review typically takes 1-2 business days.",
    priority: "high",
    daysInStage: 2,
    keyTerms: "3-year term, Net 30, 500 seats",
    businessObjective: "New logo acquisition - strategic account",
  },
  {
    id: "2",
    title: "Platform Subscription",
    customer: "Cascade Analytics",
    customerType: "new",
    arr: "$62K",
    arrValue: 62000,
    stage: "Negotiation",
    expectedClose: "Dec 20, 2024",
    nextAction: "Send revised pricing proposal",
    statusDetail: "Customer requested pricing adjustment. Revised proposal due by tomorrow.",
    priority: "high",
    daysInStage: 5,
    keyTerms: "Annual term, Net 45, 200 seats",
    businessObjective: "Competitive displacement - currently using legacy system",
  },
  {
    id: "3",
    title: "Service Renewal",
    customer: "Northwind Traders",
    customerType: "renewal",
    arr: "$45K",
    arrValue: 45000,
    stage: "Draft",
    expectedClose: "Jan 10, 2025",
    nextAction: "Schedule renewal discussion",
    statusDetail: "Contract expires in 45 days. Customer has been with us for 2 years.",
    priority: "medium",
    daysInStage: 3,
    keyTerms: "2-year renewal, Net 30, 150 seats",
    businessObjective: "Retention - expand seat count by 20%",
  },
  {
    id: "4",
    title: "Growth Package",
    customer: "Alpine Industries",
    customerType: "new",
    arr: "$38K",
    arrValue: 38000,
    stage: "Signature",
    expectedClose: "Dec 12, 2024",
    nextAction: "Awaiting customer signature",
    statusDetail: "Contract sent for signature 1 day ago. Customer confirmed they will sign by EOW.",
    priority: "high",
    daysInStage: 1,
    keyTerms: "Annual term, Net 30, 100 seats",
    businessObjective: "Land deal - expansion opportunity identified",
  },
  {
    id: "5",
    title: "Professional Services Add-on",
    customer: "Summit Healthcare",
    customerType: "renewal",
    arr: "$57K",
    arrValue: 57000,
    stage: "Negotiation",
    expectedClose: "Dec 28, 2024",
    nextAction: "Review legal markup",
    statusDetail: "Customer legal team returned contract with 3 redlines. Legal review in progress.",
    priority: "medium",
    daysInStage: 7,
    keyTerms: "2-year term, Net 60, 250 seats",
    businessObjective: "Upsell - adding implementation services",
  },
];

const approvalTasks: ApprovalTask[] = [
  {
    id: "1",
    dealName: "Meridian Software",
    customer: "Enterprise SaaS Agreement",
    type: "Manager Approval",
    dueDate: "Today",
    urgency: "high",
  },
  {
    id: "2",
    dealName: "Summit Healthcare",
    customer: "Professional Services Add-on",
    type: "Legal Review",
    dueDate: "Tomorrow",
    urgency: "medium",
  },
];

const pipelineStages = [
  { name: "Draft", count: 1, value: 45 },
  { name: "Negotiation", count: 2, value: 119 },
  { name: "Approval", count: 1, value: 85 },
  { name: "Signature", count: 1, value: 38 },
];

const teamTarget = { current: 420000, goal: 500000 };
const personalTarget = { current: 287000, goal: 350000 };

function getStageColor(stage: string) {
  switch (stage) {
    case "Draft":
      return "bg-muted text-muted-foreground border-border";
    case "Negotiation":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    case "Approval":
      return "bg-primary/10 text-primary border-primary/20";
    case "Signature":
      return "bg-status-success/10 text-status-success border-status-success/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

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

function getPriorityIndicator(priority: string) {
  switch (priority) {
    case "high":
      return "border-l-status-error";
    case "medium":
      return "border-l-status-warning";
    default:
      return "border-l-muted-foreground";
  }
}

export default function MyDeals() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const navigate = useNavigate();

  const totalPipeline = pipelineStages.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">My Deals</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Track, negotiate, close
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Deal
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => navigate("/sales/deals/new?type=new")}>
              New Customer Deal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/sales/deals/new?type=renewal")}>
              Renewal Deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pipeline Visualization - Monochrome with Deal Cards */}
      <Card className="border-border">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Deal Pipeline
            </span>
            <span className="text-2xl font-semibold">${totalPipeline}K</span>
          </div>
          
          {/* Simple Monochrome Stacked Bar */}
          <div className="h-8 flex rounded-md overflow-hidden bg-border/50">
            {pipelineStages.map((stage, index) => (
              <Tooltip key={stage.name}>
                <TooltipTrigger asChild>
                  <div 
                    className="h-full transition-all hover:brightness-110 cursor-pointer"
                    style={{ 
                      width: `${(stage.value / totalPipeline) * 100}%`,
                      backgroundColor: `hsl(var(--primary) / ${0.3 + (index * 0.2)})`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{stage.name}</p>
                  <p className="text-sm text-muted-foreground">{stage.count} deals · ${stage.value}K</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Stage Columns with Deal Cards */}
          <div className="flex mt-6">
            {pipelineStages.map((stage, index) => (
              <div key={stage.name} className="flex flex-1">
                <div className="flex-1 space-y-3 px-3 first:pl-0 last:pr-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: `hsl(var(--primary) / ${0.3 + (index * 0.2)})` }}
                      />
                      <span className="text-sm font-medium">{stage.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">${stage.value}K</span>
                  </div>
                  {/* Deal Cards */}
                  <div className="space-y-2">
                    {deals
                      .filter((d) => d.stage === stage.name)
                      .slice(0, 2)
                      .map((deal) => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className={`p-3 bg-muted/30 rounded-md border-l-2 cursor-pointer hover:bg-muted/50 transition-colors ${getPriorityIndicator(deal.priority)}`}
                        >
                          <p className="text-sm font-medium truncate">{deal.customer}</p>
                          <p className="text-xs text-muted-foreground">{deal.arr}</p>
                        </div>
                      ))}
                  </div>
                </div>
                {/* Vertical divider between columns */}
                {index < pipelineStages.length - 1 && (
                  <div className="w-px bg-border/60 self-stretch mx-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Targets Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team Target */}
        <Card className="border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team Target</p>
                  <p className="text-xl font-semibold">
                    ${(teamTarget.current / 1000).toFixed(0)}K 
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      of ${(teamTarget.goal / 1000).toFixed(0)}K
                    </span>
                  </p>
                </div>
              </div>
              <div className="w-32">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(teamTarget.current / teamTarget.goal) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {Math.round((teamTarget.current / teamTarget.goal) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Target */}
        <Card className="border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Target</p>
                  <p className="text-xl font-semibold">
                    ${(personalTarget.current / 1000).toFixed(0)}K 
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      of ${(personalTarget.goal / 1000).toFixed(0)}K
                    </span>
                  </p>
                </div>
              </div>
              <div className="w-32">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(personalTarget.current / personalTarget.goal) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {Math.round((personalTarget.current / personalTarget.goal) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Preview */}
      {approvalTasks.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-warning/10">
                  <Clock className="h-4 w-4 text-status-warning" />
                </div>
                <CardTitle className="text-base font-medium">Pending Approvals</CardTitle>
                <Badge variant="outline" className="bg-status-warning/10 text-status-warning border-status-warning/20">
                  {approvalTasks.length}
                </Badge>
              </div>
              <Link to="/sales/approvals">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {approvalTasks.slice(0, 3).map((task) => (
                <Link key={task.id} to="/sales/approvals">
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getUrgencyStyles(task.urgency)}`}
                      >
                        {task.dueDate}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{task.dealName}</p>
                    <p className="text-xs text-muted-foreground">{task.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deals Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="text-left text-sm text-muted-foreground">
              <th className="px-6 py-4 font-medium">Deal Name</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">ARR</th>
              <th className="px-6 py-4 font-medium">Stage</th>
              <th className="px-6 py-4 font-medium">Expected Close</th>
              <th className="px-6 py-4 font-medium">Next Action</th>
              <th className="px-6 py-4 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deals.slice(0, 7).map((deal) => (
              <tr 
                key={deal.id} 
                className="hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => setSelectedDeal(deal)}
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {deal.title}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <span className="text-foreground">{deal.customer}</span>
                        <Badge 
                          variant="outline" 
                          className="ml-2 text-xs"
                        >
                          {deal.customerType === "new" ? "New" : "Renewal"}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">
                        {deal.customerType === "new" 
                          ? "New customer acquisition" 
                          : "Existing customer renewal"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-6 py-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium">{deal.arr}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{deal.keyTerms}</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-6 py-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={getStageColor(deal.stage)}>
                        {deal.stage}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{deal.statusDetail}</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-6 py-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm">{deal.expectedClose}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm">{deal.daysInStage} days in current stage</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-6 py-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground">
                        {deal.nextAction}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{deal.statusDetail}</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-6 py-4">
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Detail Modal */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDeal && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge 
                      variant="outline" 
                      className={`mb-2 ${getStageColor(selectedDeal.stage)}`}
                    >
                      {selectedDeal.stage}
                    </Badge>
                    <DialogTitle className="text-xl">{selectedDeal.title}</DialogTitle>
                    <p className="text-muted-foreground mt-1">
                      {selectedDeal.customer}
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs"
                      >
                        {selectedDeal.customerType === "new" ? "New Customer" : "Renewal"}
                      </Badge>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{selectedDeal.arr}</p>
                    <p className="text-sm text-muted-foreground">Annual Value</p>
                  </div>
                </div>
              </DialogHeader>

              {/* Visual Summary */}
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Close Date</p>
                    <p className="font-semibold mt-1">{selectedDeal.expectedClose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days in Stage</p>
                    <p className="font-semibold mt-1">{selectedDeal.daysInStage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 ${
                        selectedDeal.priority === "high" 
                          ? "bg-status-error/10 text-status-error border-status-error/20"
                          : selectedDeal.priority === "medium"
                          ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {selectedDeal.priority.charAt(0).toUpperCase() + selectedDeal.priority.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Objective</h4>
                  <p className="text-sm">{selectedDeal.businessObjective}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Key Terms</h4>
                  <p className="text-sm">{selectedDeal.keyTerms}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Next Action</h4>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium">{selectedDeal.nextAction}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedDeal.statusDetail}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedDeal(null)}>
                  Close
                </Button>
                <Link to={`/sales/deals/${selectedDeal.id}`}>
                  <Button>
                    View Full Deal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
