import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Bell,
  ExternalLink,
  PartyPopper,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CompleteRequestInfoModal } from "./step-modals/CompleteRequestInfoModal";
import { CompleteTaskModal } from "./step-modals/CompleteTaskModal";
import { CompleteDocumentModal } from "./step-modals/CompleteDocumentModal";

interface WorkstreamStep {
  id: string;
  workstream_id: string;
  step_id: string;
  step_type: string;
  status: string;
  position: number;
  config: Record<string, any> | null;
  requirement_type: string;
  required_before: string | null;
  trigger_timing: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkstreamStepsPanelProps {
  workstreamId: string;
  onSwitchToApprovals?: () => void;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  request_information: <HelpCircle className="h-5 w-5 text-amber-500" />,
  approval_gate: <CheckCircle2 className="h-5 w-5 text-primary" />,
  task_assignment: <ClipboardList className="h-5 w-5 text-blue-500" />,
  generate_document: <FileText className="h-5 w-5 text-purple-500" />,
  send_notification: <Bell className="h-5 w-5 text-orange-500" />,
};

const STEP_LABELS: Record<string, string> = {
  request_information: "Request Information",
  approval_gate: "Approval Gate",
  task_assignment: "Task",
  generate_document: "Generate Document",
  send_notification: "Send Notification",
};

export function WorkstreamStepsPanel({ workstreamId, onSwitchToApprovals }: WorkstreamStepsPanelProps) {
  const [selectedStep, setSelectedStep] = useState<WorkstreamStep | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: steps = [], isLoading } = useQuery({
    queryKey: ["workstream-steps", workstreamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstream_steps")
        .select("*")
        .eq("workstream_id", workstreamId)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data || []) as WorkstreamStep[];
    },
  });

  const allComplete = steps.length > 0 && steps.every(s => s.status === "complete");

  // Handle step completion - uses modal for now until play-based UI is built
  const handleStepComplete = async (step: WorkstreamStep) => {
    // For now, always use modal until play execution UI is ready
    // In the future, this will check if the step is part of a play and execute accordingly
    setSelectedStep(step);
    setModalType(step.step_type);
  };

  const handleModalClose = () => {
    setSelectedStep(null);
    setModalType(null);
  };

  const handleStepCompleted = () => {
    queryClient.invalidateQueries({ queryKey: ["workstream-steps", workstreamId] });
    queryClient.invalidateQueries({ queryKey: ["workstream-activity", workstreamId] });
    handleModalClose();
  };

  const getStepDescription = (step: WorkstreamStep): string => {
    const config = step.config || {};
    const docs = config.documents as Array<{ document_type?: string; template_name?: string }> | undefined;
    switch (step.step_type) {
      case "request_information":
        return config.info_needed || "Provide required information";
      case "approval_gate":
        return config.gate_name || "Approval required";
      case "task_assignment":
        return config.task_description || "Complete assigned task";
      case "generate_document": {
        if (docs && docs.length > 0) {
          return docs.map(d => d.document_type).filter(Boolean).join(", ") || "Generate required document";
        }
        return config.document_type || "Generate required document";
      }
      case "send_notification":
        return config.message || "Send notification";
      default:
        return "Complete this step";
    }
  };

  const getRequirementLabel = (step: WorkstreamStep): string => {
    switch (step.required_before) {
      case "signature":
        return "Required: Before signature";
      case "approval":
        return "Required: Before approval";
      default:
        return "Required: Immediate";
    }
  };

  const getApprovalStatus = (step: WorkstreamStep): string => {
    const config = step.config || {};
    const pendingRole = config.pending_role || config.assigned_role || "reviewer";
    return `Pending ${pendingRole.replace(/_/g, " ")} review`;
  };

  /** Whether this step can be acted on by an internal user */
  const canInternalUserComplete = (step: WorkstreamStep): boolean => {
    if (step.status === "complete") return false;
    if (step.step_type === "approval_gate") return false;
    // System-automated step types
    if (step.step_type === "send_notification") return false;
    if (step.step_type === "generate_document") return false;
    // Counterparty-facing steps
    if (step.config?.request_from === "counterparty") return false;
    return true;
  };

  const getOwnerLabel = (step: WorkstreamStep): string => {
    const config = step.config || {};
    if (config.assigned_role) return `Assigned: ${(config.assigned_role as string).replace(/_/g, " ")}`;
    if (config.notify_team) return `Team: ${(config.notify_team as string).replace(/_/g, " ")}`;
    if (config.request_from) return `From: ${(config.request_from as string).replace(/_/g, " ")}`;
    return "Anyone can complete";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No workflow steps defined for this workstream.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workflow Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* All Complete Celebration */}
        {allComplete && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <PartyPopper className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">All steps complete!</p>
              <p className="text-sm text-green-600 dark:text-green-300">
                All workflow requirements have been satisfied.
              </p>
            </div>
          </div>
        )}

        {/* All steps in position order */}
        {steps.map((step) => {
          const isComplete = step.status === "complete";
          const isApproval = step.step_type === "approval_gate";
          const completable = canInternalUserComplete(step);

          return (
            <div
              key={step.id}
              className={`p-4 border rounded-lg transition-colors ${
                isComplete
                  ? "bg-muted/30 border-muted"
                  : "bg-card hover:bg-accent/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    STEP_ICONS[step.step_type] || <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${isComplete ? "text-muted-foreground" : ""}`}>
                      {STEP_LABELS[step.step_type] || step.step_type}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${isComplete ? "border-green-300 text-green-600" : ""}`}
                    >
                      {step.status}
                    </Badge>
                    {step.completed_at && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(step.completed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-1 ${isComplete ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                    {getStepDescription(step)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRequirementLabel(step)} • {getOwnerLabel(step)}
                  </p>

                  {/* Action area — only for incomplete steps */}
                  {!isComplete && isApproval && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Status: {getApprovalStatus(step)}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        onClick={onSwitchToApprovals}
                      >
                        View in Approvals Tab
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                  {completable && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => handleStepComplete(step)}
                    >
                      Complete This Step
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Modals */}
      {selectedStep && modalType === "request_information" && (
        <CompleteRequestInfoModal
          step={selectedStep}
          onClose={handleModalClose}
          onComplete={handleStepCompleted}
        />
      )}
      {selectedStep && modalType === "task_assignment" && (
        <CompleteTaskModal
          step={selectedStep}
          onClose={handleModalClose}
          onComplete={handleStepCompleted}
        />
      )}
      {selectedStep && modalType === "generate_document" && (
        <CompleteDocumentModal
          step={selectedStep}
          onClose={handleModalClose}
          onComplete={handleStepCompleted}
        />
      )}
    </Card>
  );
}
