import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, TrendingUp, Users, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
const contracts = [{
  id: "1",
  title: "Acme Corp Enterprise Deal",
  objective: "New customer acquisition",
  type: "SaaS Agreement",
  status: "Pending Signature",
  value: "$500K ARR"
}, {
  id: "2",
  title: "TechVendor Partnership",
  objective: "Strategic partnership",
  type: "Partnership Agreement",
  status: "In Negotiation",
  value: "$2M revenue"
}, {
  id: "3",
  title: "Regional Distributor - APAC",
  objective: "Market expansion",
  type: "Distribution Agreement",
  status: "Draft",
  value: "$1.5M revenue"
}, {
  id: "4",
  title: "CloudHost Infrastructure",
  objective: "Cost reduction",
  type: "Service Agreement",
  status: "Signed",
  value: "$200K savings"
}, {
  id: "5",
  title: "Marketing Agency Retainer",
  objective: "Brand development",
  type: "MSA",
  status: "Pending Review",
  value: "$150K cost"
}];
const tasks = [{
  id: "1",
  stage: "Business Review",
  title: "Define expected outcomes for Acme Corp deal",
  due: "Today",
  priority: "High"
}, {
  id: "2",
  stage: "Financial Review",
  title: "Approve pricing structure for TechVendor",
  due: "Tomorrow",
  priority: "Medium"
}, {
  id: "3",
  stage: "Commercial Review",
  title: "Review territory terms for APAC distributor",
  due: "3 days",
  priority: "Medium"
}, {
  id: "4",
  stage: "Negotiation",
  title: "Respond to CloudHost counter-proposal",
  due: "Today",
  priority: "High"
}, {
  id: "5",
  stage: "Performance",
  title: "Q1 business review for existing client",
  due: "Next week",
  priority: "Low"
}];
const metrics = [{
  title: "Expected Revenue This Quarter",
  value: "$4M",
  icon: DollarSign
}, {
  title: "Contracts Up for Renewal",
  value: "12",
  icon: TrendingUp
}, {
  title: "Deals in Negotiation",
  value: "5",
  icon: Users
}];
function getStatusColor(status: string) {
  switch (status) {
    case "Signed":
      return "bg-status-success/10 text-status-success border-status-success/20";
    case "In Negotiation":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    case "Draft":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
export default function Dashboard() {
  return <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-0">
        <h1 className="text-5xl font-semibold text-foreground">Building your business is hard. 
Signing a contract should be easy.</h1>
        <Link to="/create/objective">
          <Button size="lg" className="text-base px-8 py-px my-[15px]">
            <Plus className="mr-2 h-5 w-5" />
            Create New Contract
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Contracts - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Contracts</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">Draft</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">In Review</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">Signed</Button>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Business Objective</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Expected Value</th>
                  <th className="px-6 py-4 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map(contract => <tr key={contract.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/contracts/${contract.id}`} className="font-medium text-foreground hover:text-primary">
                        {contract.title}
                      </Link>
                      <div className="text-sm text-muted-foreground">{contract.type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{contract.objective}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{contract.value}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* My Tasks - Right Column (1/3) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {tasks.map(task => <Card key={task.id} className="border border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs bg-muted">
                      {task.stage}
                    </Badge>
                    {task.priority === "High" && <span className="text-xs font-medium text-destructive">High</span>}
                  </div>
                  <p className="text-sm font-medium leading-snug">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Due: {task.due}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </div>

      {/* Business Impact Summary */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Business Impact Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map(metric => <Card key={metric.title} className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{metric.value}</div>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </div>;
}