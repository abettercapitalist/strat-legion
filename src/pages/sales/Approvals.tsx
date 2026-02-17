import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, MessageSquare, Inbox } from "lucide-react";
import { useSalesApprovalQueue, formatCurrency } from "@/hooks/useDeals";
import { ApprovalDecisionModal } from "@/components/approvals/ApprovalDecisionModal";

function getSLAColor(urgency: "high" | "medium" | "low") {
  switch (urgency) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    default:
      return "bg-status-success/10 text-status-success border-status-success/20";
  }
}

function formatSubmittedDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getSLADueLabel(submittedAt: string | null): string {
  if (!submittedAt) return "—";
  const daysWaiting = Math.floor(
    (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysWaiting === 0) return "Today";
  if (daysWaiting === 1) return "1 day ago";
  if (daysWaiting < 7) return `${daysWaiting} days ago`;
  return "Overdue";
}

function formatTier(tier: string | null): string {
  if (!tier) return "—";
  return tier
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Approvals() {
  const queryClient = useQueryClient();
  const { data: approvals, isLoading } = useSalesApprovalQueue();

  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState("");
  const [initialDecision, setInitialDecision] = useState<"approved" | "rejected" | undefined>();

  const handleAction = (
    approvalId: string,
    dealName: string,
    decision?: "approved" | "rejected"
  ) => {
    setSelectedApprovalId(approvalId);
    setSelectedDealName(dealName);
    setInitialDecision(decision);
  };

  const handleDecisionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["sales-approval-queue"] });
    queryClient.invalidateQueries({ queryKey: ["sales-pending-approvals"] });
    setSelectedApprovalId(null);
    setInitialDecision(undefined);
  };

  const pendingCount = approvals?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Approval Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve deals awaiting manager approval
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="text-base px-4 py-2 bg-destructive text-destructive-foreground">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : pendingCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">No pending approvals</p>
          <p className="text-sm mt-1">All caught up — nothing needs your attention right now.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-6 py-4 font-medium">Deal Name</th>
                <th className="px-6 py-4 font-medium">Owner</th>
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
                    {approval.ownerName || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {approval.customer}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium font-mono">
                    {formatCurrency(approval.arr)}
                  </td>
                  <td className="px-6 py-4">
                    {approval.dealTier ? (
                      <Badge variant="outline" className="bg-muted">
                        {formatTier(approval.dealTier)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatSubmittedDate(approval.submittedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getSLAColor(approval.urgency)}>
                      {getSLADueLabel(approval.submittedAt)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(approval.id, approval.dealName)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleAction(approval.id, approval.dealName, "rejected")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(approval.id, approval.dealName, "approved")}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ApprovalDecisionModal
        open={!!selectedApprovalId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApprovalId(null);
            setInitialDecision(undefined);
          }
        }}
        approvalId={selectedApprovalId || ""}
        dealName={selectedDealName}
        onDecisionComplete={handleDecisionComplete}
        initialDecision={initialDecision}
      />
    </div>
  );
}
