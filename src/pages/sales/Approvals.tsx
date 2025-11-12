import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare } from "lucide-react";

const approvals = [
  {
    id: "1",
    dealName: "Acme Corp Enterprise Agreement",
    ae: "John Smith",
    customer: "Acme Corporation",
    arr: "$500,000",
    dealTier: "Field Enterprise",
    submittedDate: "2025-11-10",
    slaDue: "2025-11-12",
    status: "pending",
  },
  {
    id: "2",
    dealName: "TechStart SaaS Agreement",
    ae: "Emily Johnson",
    customer: "TechStart Inc",
    arr: "$75,000",
    dealTier: "Inside Standard",
    submittedDate: "2025-11-09",
    slaDue: "2025-11-11",
    status: "pending",
  },
  {
    id: "3",
    dealName: "BigBank Framework Agreement",
    ae: "John Smith",
    customer: "BigBank Financial",
    arr: "$1,200,000",
    dealTier: "Field Strategic",
    submittedDate: "2025-11-08",
    slaDue: "2025-11-10",
    status: "urgent",
  },
];

function getSLAColor(status: string) {
  switch (status) {
    case "urgent":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "pending":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    default:
      return "bg-status-success/10 text-status-success border-status-success/20";
  }
}

export default function Approvals() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Approval Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve deals awaiting manager approval
          </p>
        </div>
        <Badge className="text-base px-4 py-2 bg-destructive text-destructive-foreground">
          5 Pending
        </Badge>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="text-left text-sm text-muted-foreground">
              <th className="px-6 py-4 font-medium">Deal Name</th>
              <th className="px-6 py-4 font-medium">AE</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">ARR</th>
              <th className="px-6 py-4 font-medium">Deal Tier</th>
              <th className="px-6 py-4 font-medium">Submitted</th>
              <th className="px-6 py-4 font-medium">SLA Due</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {approvals.map((approval) => (
              <tr key={approval.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">
                    {approval.dealName}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {approval.ae}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {approval.customer}
                </td>
                <td className="px-6 py-4 text-sm font-medium font-mono">
                  {approval.arr}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-muted">
                    {approval.dealTier}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {approval.submittedDate}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={getSLAColor(approval.status)}>
                    {approval.slaDue}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm">
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
