import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  HelpCircle,
  CheckCircle2,
  ClipboardList,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PartyPopper,
  Loader2,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CompleteRequestInfoModal } from "./step-modals/CompleteRequestInfoModal";
import { CompleteTaskModal } from "./step-modals/CompleteTaskModal";
import { CompleteDocumentModal } from "./step-modals/CompleteDocumentModal";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useBrickStepExecution } from "@/hooks/useBrickStepExecution";
import type { Workstream, CurrentUser } from "@/lib/bricks/services/stepExecutor";

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
};

const STEP_LABELS: Record<string, string> = {
  request_information: "Request Information",
  approval_gate: "Approval Gate",
  task_assignment: "Task",
  generate_document: "Generate Document",
};

export function WorkstreamStepsPanel({ workstreamId, onSwitchToApprovals }: WorkstreamStepsPanelProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkstreamStep | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { userId, workRoutingRoleIds, isManager } = useCurrentUserRole();

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

  // Load full workstream data for brick execution
  const { data: workstream } = useQuery({
    queryKey: ["workstream", workstreamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("workstreams")
        .select("*")
        .eq("id", workstreamId)
        .single();
      return data as Workstream | null;
    },
  });

  // Load current user data
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      return {
        id: user.id,
        email: user.email || "",
        role: profile?.role || null,
      } as CurrentUser;
    },
  });

  // Brick execution hook
  const {
    isExecuting: isBrickExecuting,
    executeStep: executeBrickStep,
    checkBrickSupport,
  } = useBrickStepExecution();

  // Track which steps have brick support
  const [brickSupportMap, setBrickSupportMap] = useState<Record<string, boolean>>({});

  // Check brick support for each step type
  useEffect(() => {
    const checkSupport = async () => {
      const stepTypes = [...new Set(steps.map(s => s.step_type))];
      const supportMap: Record<string, boolean> = {};
      for (const stepType of stepTypes) {
        supportMap[stepType] = await checkBrickSupport(stepType);
      }
      setBrickSupportMap(supportMap);
    };
    if (steps.length > 0) {
      checkSupport();
    }
  }, [steps, checkBrickSupport]);

  const isOwner = workstream?.owner_id === userId;
  const canSeeAllSteps = isOwner || isManager;

  const completedSteps = steps.filter(s => s.status === "complete");
  const incompleteSteps = steps.filter(s => s.status !== "complete");

  // Filter steps based on visibility rules
  const visibleIncompleteSteps = canSeeAllSteps 
    ? incompleteSteps 
    : incompleteSteps.filter(step => {
        const assignedRole = step.config?.assigned_role;
        if (!assignedRole) return true; // Unassigned = visible to all
        return workRoutingRoleIds.includes(assignedRole);
      });

  // Handle step completion - tries brick execution first, falls back to modal
  const handleStepComplete = async (step: WorkstreamStep) => {
    const hasBrickSupport = brickSupportMap[step.step_type];

    // If no brick support, go straight to modal
    if (!hasBrickSupport) {
      setSelectedStep(step);
      setModalType(step.step_type);
      return;
    }

    // Try brick execution
    if (!workstream || !currentUser) {
      // No context available, fall back to modal
      setSelectedStep(step);
      setModalType(step.step_type);
      return;
    }

    const outcome = await executeBrickStep(
      step,
      workstream,
      currentUser
    );

    // If the step requires user input, fall back to modal
    if (outcome.requiresUserAction || !outcome.success) {
      setSelectedStep(step);
      setModalType(step.step_type);
    }
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
    switch (step.step_type) {
      case "request_information":
        return config.info_needed || "Provide required information";
      case "approval_gate":
        return config.gate_name || "Approval required";
      case "task_assignment":
        return config.task_description || "Complete assigned task";
      case "generate_document":
        return config.document_type || "Generate required document";
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

  const allComplete = incompleteSteps.length === 0 && completedSteps.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workflow Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Active Steps */}
        {visibleIncompleteSteps.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Steps ({visibleIncompleteSteps.length})
            </h3>
            {visibleIncompleteSteps.map((step) => (
              <div
                key={step.id}
                className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{STEP_ICONS[step.step_type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {STEP_LABELS[step.step_type] || step.step_type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {getStepDescription(step)}
                    </p>
                    
                    {step.step_type === "approval_gate" ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
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
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-3">
                          {getRequirementLabel(step)}
                          {!step.config?.assigned_role && " • Anyone can complete"}
                          {brickSupportMap[step.step_type] && (
                            <span className="ml-2 inline-flex items-center text-primary">
                              <Zap className="h-3 w-3 mr-0.5" />
                              Brick-powered
                            </span>
                          )}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleStepComplete(step)}
                          disabled={isBrickExecuting}
                        >
                          {isBrickExecuting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            "Complete This Step"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Steps */}
        {completedSteps.length > 0 && (
          <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-auto py-2">
                <span className="text-sm text-muted-foreground">
                  Completed Steps ({completedSteps.length})
                </span>
                {showCompleted ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {completedSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground">
                      {getStepDescription(step)}
                    </span>
                  </div>
                  {step.completed_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(step.completed_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
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
