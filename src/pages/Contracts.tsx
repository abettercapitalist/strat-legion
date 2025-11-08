import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

const contracts = [
  {
    id: "1",
    title: "Acme Corp Enterprise Deal",
    objective: "New customer acquisition",
    type: "SaaS Agreement",
    status: "Pending Signature",
    value: "$500K ARR",
  },
  {
    id: "2",
    title: "TechVendor Partnership",
    objective: "Strategic partnership",
    type: "Partnership Agreement",
    status: "In Negotiation",
    value: "$2M revenue",
  },
  {
    id: "3",
    title: "Regional Distributor - APAC",
    objective: "Market expansion",
    type: "Distribution Agreement",
    status: "Draft",
    value: "$1.5M revenue",
  },
  {
    id: "4",
    title: "CloudHost Infrastructure",
    objective: "Cost reduction",
    type: "Service Agreement",
    status: "Signed",
    value: "$200K savings",
  },
  {
    id: "5",
    title: "Marketing Agency Retainer",
    objective: "Brand development",
    type: "MSA",
    status: "Pending Review",
    value: "$150K cost",
  },
];

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

export default function Contracts() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Contracts</h1>
          <p className="text-lg text-muted-foreground mt-2">All your contracts in one place</p>
        </div>
        <Link to="/create/objective">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Contract
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">All</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">Draft</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">In Review</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">In Negotiation</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">Signed</Button>
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
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-muted/20 transition-colors">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
