import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  MoreVertical, 
  ArrowRight,
  Clock,
  TrendingUp,
  Users
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
  { name: "Draft", count: 1, value: "$45K" },
  { name: "Negotiation", count: 2, value: "$119K" },
  { name: "Approval", count: 1, value: "$85K" },
  { name: "Signature", count: 1, value: "$38K" },
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">My Deals</h1>
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

      {/* Pipeline Visualization + Targets */}
      <div className="grid grid-cols-3 gap-6">
        {/* Kanban Pipeline - Takes 2/3 */}
        <Card className="col-span-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Deal Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {pipelineStages.map((stage) => (
                <div 
                  key={stage.name} 
                  className="bg-muted/30 rounded-lg p-4 min-h-[120px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {stage.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {stage.count}
                    </Badge>
                  </div>
                  <p className="text-2xl font-semibold">{stage.value}</p>
                  <div className="mt-3 space-y-2">
                    {deals
                      .filter((d) => d.stage === stage.name)
                      .slice(0, 2)
                      .map((deal) => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className={`text-xs p-2 bg-card rounded border-l-2 cursor-pointer hover:bg-muted/50 transition-colors ${getPriorityIndicator(deal.priority)}`}
                        >
                          <p className="font-medium truncate">{deal.customer}</p>
                          <p className="text-muted-foreground">{deal.arr}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Targets - Takes 1/3 */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Target
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">${(teamTarget.current / 1000).toFixed(0)}K</span>
                  <span className="text-muted-foreground">of ${(teamTarget.goal / 1000).toFixed(0)}K</span>
                </div>
                <Progress 
                  value={(teamTarget.current / teamTarget.goal) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round((teamTarget.current / teamTarget.goal) * 100)}% to goal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Your Target
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">${(personalTarget.current / 1000).toFixed(0)}K</span>
                  <span className="text-muted-foreground">of ${(personalTarget.goal / 1000).toFixed(0)}K</span>
                </div>
                <Progress 
                  value={(personalTarget.current / personalTarget.goal) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round((personalTarget.current / personalTarget.goal) * 100)}% to goal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Approvals Preview */}
      {approvalTasks.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-status-warning" />
                <CardTitle className="text-base font-medium">Pending Approvals</CardTitle>
                <Badge variant="outline" className="text-xs">
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
                  <div className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getUrgencyStyles(task.urgency)}`}
                      >
                        {task.dueDate}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{task.dealName}</p>
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
                className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setSelectedDeal(deal)}
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-foreground">
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Card Modal */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDeal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl">{selectedDeal.title}</DialogTitle>
                  <Badge variant="outline" className={getStageColor(selectedDeal.stage)}>
                    {selectedDeal.stage}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {selectedDeal.customer} · {selectedDeal.customerType === "new" ? "New Customer" : "Renewal"}
                </p>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 mt-4">
                {/* Left Column - Key Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
                    <p className="text-2xl font-semibold">{selectedDeal.arr}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Close</p>
                    <p className="font-medium">{selectedDeal.expectedClose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Key Terms</p>
                    <p className="text-sm">{selectedDeal.keyTerms}</p>
                  </div>
                </div>

                {/* Right Column - Status & Context */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Business Objective</p>
                    <p className="text-sm">{selectedDeal.businessObjective}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <p className="text-sm">{selectedDeal.statusDetail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Action</p>
                    <p className="text-sm font-medium">{selectedDeal.nextAction}</p>
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Deal Progress</p>
                <div className="flex gap-1">
                  {["Draft", "Negotiation", "Approval", "Signature"].map((stage, i) => {
                    const stageIndex = ["Draft", "Negotiation", "Approval", "Signature"].indexOf(selectedDeal.stage);
                    return (
                      <div
                        key={stage}
                        className={`h-2 flex-1 rounded-full ${
                          i <= stageIndex ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedDeal(null)}>
                  Close
                </Button>
                <Link to={`/sales/deals/${selectedDeal.id}`}>
                  <Button>
                    View Full Deal
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
