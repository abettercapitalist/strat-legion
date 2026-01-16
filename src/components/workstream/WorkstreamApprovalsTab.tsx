import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, XCircle, AlertCircle, Lock, Unlock, ThumbsUp, ThumbsDown } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getRouteName } from "@/lib/approvalUtils";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { ApprovalDecisionModal } from "@/components/approvals/ApprovalDecisionModal";

interface WorkstreamApprovalsTabProps {
  workstreamId: string;
}

interface ApprovalRoute {
  role?: string;
  approvers?: Array<{ role: string; is_required?: boolean }>;
  position?: number;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200", label: "Pending" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200", label: "Rejected" },
  skipped: { icon: AlertCircle, color: "bg-muted text-muted-foreground", label: "Skipped" },
  locked: { icon: Lock, color: "bg-muted/50 text-muted-foreground", label: "Locked" },
};

// Map legacy role names to check user assignment
const LEGACY_ROLE_MAP: Record<string, string[]> = {
  sales_manager: ["sales_manager"],
  finance_reviewer: ["finance_reviewer"],
  contract_counsel: ["contract_counsel"],
  legal_ops: ["legal_ops"],
  general_counsel: ["general_counsel"],
  account_executive: ["account_executive"],
};

export function WorkstreamApprovalsTab({ workstreamId }: WorkstreamApprovalsTabProps) {
  const queryClient = useQueryClient();
  const { role: legacyRole, customRoles, userId, isManager } = useCurrentUserRole();
  
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<"approved" | "rejected" | undefined>(undefined);
  const [dealName, setDealName] = useState<string>("");

  // Fetch workstream for deal name
  const { data: workstream } = useQuery({
    queryKey: ["workstream-basic", workstreamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstreams")
        .select("name")
        .eq("id", workstreamId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: approvals, isLoading } = useQuery({
    queryKey: ["workstream-approvals", workstreamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstream_approvals")
        .select(`
          *,
          approval_template:approval_templates(name, description, approval_sequence)
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

  // Check if current user is assigned to a specific route
  const isUserAssignedToRoute = (approvalSequence: ApprovalRoute[] | null, gateNumber: number): boolean => {
    if (!approvalSequence || !Array.isArray(approvalSequence)) return false;

    const route = approvalSequence.find(r => (r.position || 0) === gateNumber);
    if (!route) return false;

    // Get roles from the route
    const routeRoles: string[] = [];
    if (route.role) {
      routeRoles.push(route.role);
    }
    if (route.approvers && Array.isArray(route.approvers)) {
      route.approvers.forEach(approver => {
        if (approver.role) {
          routeRoles.push(approver.role);
        }
      });
    }

    // Check legacy role match
    if (legacyRole) {
      const legacyMatches = LEGACY_ROLE_MAP[legacyRole] || [legacyRole];
      if (routeRoles.some(role => legacyMatches.includes(role) || role === legacyRole)) {
        return true;
      }
    }

    // Check custom roles match (by name)
    if (customRoles.length > 0) {
      const customRoleNames = customRoles.map(cr => cr.name.toLowerCase());
      if (routeRoles.some(role => customRoleNames.includes(role.toLowerCase()))) {
        return true;
      }
    }

    // Managers can act on any approval
    if (isManager) return true;

    return false;
  };

  // Check if current user has already decided on an approval
  const hasUserDecided = (approvalId: string): boolean => {
    if (!decisions || !userId) return false;
    return decisions.some(d => d.approval_id === approvalId && d.decided_by === userId);
  };

  // Get pending approver role for display
  const getPendingApproverRole = (approvalSequence: ApprovalRoute[] | null, gateNumber: number): string => {
    if (!approvalSequence || !Array.isArray(approvalSequence)) return "Approver";

    const route = approvalSequence.find(r => (r.position || 0) === gateNumber);
    if (!route) return "Approver";

    if (route.approvers && route.approvers.length > 0) {
      return route.approvers.map(a => a.role?.replace(/_/g, ' ')).filter(Boolean).join(', ');
    }
    if (route.role) {
      return route.role.replace(/_/g, ' ');
    }
    return "Approver";
  };

  const handleApprovalAction = (approvalId: string, decision: "approved" | "rejected") => {
    setDealName(workstream?.name || "Workstream");
    setSelectedApprovalId(approvalId);
    setSelectedDecision(decision);
  };

  const handleDecisionComplete = () => {
    // Refresh approvals and decisions
    queryClient.invalidateQueries({ queryKey: ["workstream-approvals", workstreamId] });
    queryClient.invalidateQueries({ queryKey: ["workstream-approval-decisions", workstreamId] });
    setSelectedApprovalId(null);
    setSelectedDecision(undefined);
  };

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

  // Determine gate locking: a gate is locked if a previous gate is still pending
  const getGateLockStatus = (gateNumber: number): { isLocked: boolean; blockedByGate?: number } => {
    // Find the lowest gate number that is still pending
    const pendingGates = approvals
      .filter(a => a.status === "pending" && (a.current_gate || 0) < gateNumber)
      .map(a => a.current_gate || 0);
    
    if (pendingGates.length > 0) {
      const lowestPendingGate = Math.min(...pendingGates);
      return { isLocked: true, blockedByGate: lowestPendingGate };
    }
    
    return { isLocked: false };
  };

  return (
    <div className="space-y-4">
      {/* Gate Progress Indicator */}
      <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
        {approvals.map((approval, index) => {
          const status = approval.status || "pending";
          const gateNumber = approval.current_gate || (index + 1);
          const { isLocked } = getGateLockStatus(gateNumber);
          
          return (
            <div key={approval.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                status === "approved" 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" 
                  : status === "rejected"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  : isLocked
                  ? "bg-muted text-muted-foreground"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
              }`}>
                {status === "approved" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : status === "rejected" ? (
                  <XCircle className="h-4 w-4" />
                ) : isLocked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  gateNumber
                )}
              </div>
              {index < approvals.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  status === "approved" ? "bg-green-500" : "bg-muted"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {approvals.map((approval) => {
        const status = approval.status || "pending";
        const gateNumber = approval.current_gate || 1;
        const { isLocked, blockedByGate } = getGateLockStatus(gateNumber);
        
        // Use locked status for display if gate is locked
        const displayStatus = isLocked && status === "pending" ? "locked" : status;
        const config = statusConfig[displayStatus] || statusConfig.pending;
        const Icon = config.icon;
        const relatedDecisions = decisions?.filter(d => d.approval_id === approval.id) || [];

        const approvalSequence = (approval.approval_template as any)?.approval_sequence;
        const routeName = getRouteName(approvalSequence, gateNumber);
        
        // Determine if user can take action
        const isPending = status === "pending";
        const isUnlocked = !isLocked;
        const isAssigned = isUserAssignedToRoute(approvalSequence, gateNumber);
        const hasDecided = hasUserDecided(approval.id);
        const canTakeAction = isPending && isUnlocked && isAssigned && !hasDecided;
        
        const pendingApproverRole = getPendingApproverRole(approvalSequence, gateNumber);

        return (
          <Card key={approval.id} className={isLocked ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {approval.approval_template?.name || routeName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isLocked && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      Waiting for Gate {blockedByGate}
                    </Badge>
                  )}
                  <Badge className={config.color}>{config.label}</Badge>
                </div>
              </div>
              {approval.approval_template?.description && (
                <p className="text-sm text-muted-foreground">{approval.approval_template.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gate</p>
                  <p className="font-medium flex items-center gap-1">
                    {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    Gate {gateNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Route</p>
                  <p className="font-medium">{routeName}</p>
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
                {status === "pending" && !isLocked && approval.submitted_at && (
                  <div>
                    <p className="text-muted-foreground">Waiting</p>
                    <p className="font-medium">{formatDistanceToNow(new Date(approval.submitted_at))}</p>
                  </div>
                )}
              </div>

              {/* Pending Status for Non-Assigned Users */}
              {isPending && isUnlocked && !isAssigned && !hasDecided && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                  <Clock className="h-4 w-4" />
                  <span>Pending <span className="capitalize">{pendingApproverRole}</span> review</span>
                </div>
              )}

              {/* Already Decided Message */}
              {isPending && isUnlocked && hasDecided && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                  <CheckCircle className="h-4 w-4" />
                  <span>You have already submitted your decision on this approval</span>
                </div>
              )}

              {/* Action Buttons for Assigned Users */}
              {canTakeAction && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Your Action Required</p>
                    <p className="text-xs text-muted-foreground">
                      Review and submit your decision for this approval gate
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => handleApprovalAction(approval.id, "rejected")}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleApprovalAction(approval.id, "approved")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}

              {/* Locked Gate Message */}
              {isLocked && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>This gate will unlock after Gate {blockedByGate} is completed.</span>
                </div>
              )}

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
                            {(decision as any).decided_by_profile?.full_name || "User"} • {format(new Date(decision.created_at), "MMM d, yyyy 'at' h:mm a")}
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

      {/* Approval Decision Modal */}
      <ApprovalDecisionModal
        open={!!selectedApprovalId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApprovalId(null);
            setSelectedDecision(undefined);
          }
        }}
        approvalId={selectedApprovalId || ""}
        dealName={dealName}
        onDecisionComplete={handleDecisionComplete}
        initialDecision={selectedDecision}
      />
    </div>
  );
}
