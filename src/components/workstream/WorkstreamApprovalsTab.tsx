import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface WorkstreamApprovalsTabProps {
  workstreamId: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200", label: "Pending" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200", label: "Rejected" },
  skipped: { icon: AlertCircle, color: "bg-muted text-muted-foreground", label: "Skipped" },
};

export function WorkstreamApprovalsTab({ workstreamId }: WorkstreamApprovalsTabProps) {
  const { data: approvals, isLoading } = useQuery({
    queryKey: ["workstream-approvals", workstreamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstream_approvals")
        .select(`
          *,
          approval_template:approval_templates(name, description)
        `)
        .eq("workstream_id", workstreamId)
        .order("current_gate", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: decisions } = useQuery({
    queryKey: ["workstream-approval-decisions", workstreamId],
    queryFn: async () => {
      if (!approvals?.length) return [];
      
      const approvalIds = approvals.map(a => a.id);
      const { data, error } = await supabase
        .from("approval_decisions")
        .select(`
          *,
          decided_by_profile:profiles!approval_decisions_decided_by_fkey(full_name, email)
        `)
        .in("approval_id", approvalIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching decisions:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!approvals?.length,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!approvals?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No approvals required for this workstream</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => {
        const status = approval.status || "pending";
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        const relatedDecisions = decisions?.filter(d => d.approval_id === approval.id) || [];

        return (
          <Card key={approval.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {approval.approval_template?.name || `Approval Gate ${approval.current_gate}`}
                </CardTitle>
                <Badge className={config.color}>{config.label}</Badge>
              </div>
              {approval.approval_template?.description && (
                <p className="text-sm text-muted-foreground">{approval.approval_template.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gate</p>
                  <p className="font-medium">{approval.current_gate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {approval.submitted_at 
                      ? format(new Date(approval.submitted_at), "MMM d, yyyy")
                      : "Not submitted"}
                  </p>
                </div>
                {approval.completed_at && (
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-medium">{format(new Date(approval.completed_at), "MMM d, yyyy")}</p>
                  </div>
                )}
                {status === "pending" && approval.submitted_at && (
                  <div>
                    <p className="text-muted-foreground">Waiting</p>
                    <p className="font-medium">{formatDistanceToNow(new Date(approval.submitted_at))}</p>
                  </div>
                )}
              </div>

              {/* Decision History */}
              {relatedDecisions.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Decision History</p>
                  <div className="space-y-2">
                    {relatedDecisions.map((decision) => (
                      <div key={decision.id} className="flex items-start gap-3 text-sm bg-muted/50 rounded-lg p-3">
                        <div className={`mt-0.5 p-1 rounded-full ${
                          decision.decision === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {decision.decision === 'approved' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{decision.decision}</p>
                          {decision.reasoning && (
                            <p className="text-muted-foreground mt-1">{decision.reasoning}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(decision.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}