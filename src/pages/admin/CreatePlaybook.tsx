import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWorkstreamTypes } from "@/hooks/useWorkstreamTypes";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { PlayFormStepper, FormStep } from "@/components/admin/PlayFormStepper";
import { ValidationSummaryPanel, ValidationError } from "@/components/admin/ValidationSummaryPanel";
import { TeamCombobox } from "@/components/admin/TeamCombobox";
import { PlayApprovalSection, PlayApprovalConfig } from "@/components/admin/PlayApprovalSection";
import {
  WorkflowCanvasSection,
  type WorkflowCanvasSectionHandle,
} from "@/components/admin/workflow-builder/WorkflowCanvasSection";
import type { WorkflowRFNode, WorkflowRFEdge } from "@/components/admin/workflow-builder/types";
import { useWorkflowPersistence } from "@/components/admin/workflow-builder/hooks/useWorkflowPersistence";

const playbookSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  team_category: z.string().min(1, "Assigned team is required"),
});

type PlaybookFormData = z.infer<typeof playbookSchema>;

export default function CreatePlaybook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { createWorkstreamType, updateWorkstreamType } = useWorkstreamTypes();
  const { hasSubgroups, getTeamById } = useTeams();
  const isEditing = Boolean(id);

  const [currentStep, setCurrentStep] = useState<FormStep>("basics");
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [playApprovalConfig, setPlayApprovalConfig] = useState<PlayApprovalConfig>({
    required_roles: [],
    approval_mode: "all",
  });

  // Workflow canvas ref and state
  const canvasRef = useRef<WorkflowCanvasSectionHandle>(null);
  const [initialNodes, setInitialNodes] = useState<WorkflowRFNode[]>([]);
  const [initialEdges, setInitialEdges] = useState<WorkflowRFEdge[]>([]);
  const persistence = useWorkflowPersistence();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlaybookFormData>({
    resolver: zodResolver(playbookSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      team_category: undefined,
    },
  });

  const descriptionValue = watch("description") || "";
  const displayNameValue = watch("display_name") || "";
  const teamCategory = watch("team_category");

  // Fetch existing play data for edit mode
  useEffect(() => {
    if (!id) return;

    const fetchPlay = async () => {
      setIsLoadingPlay(true);
      try {
        const { data, error } = await supabase
          .from("workstream_types")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setExistingStatus(data.status);
          reset({
            name: data.name,
            display_name: data.display_name || "",
            description: data.description || "",
            team_category: data.team_category as PlaybookFormData["team_category"],
          });

          // Load play approval config
          if (data.play_approval_config) {
            setPlayApprovalConfig(data.play_approval_config as unknown as PlayApprovalConfig);
          }

          // Load DAG workflow from relational tables
          const dagState = await persistence.loadWorkflow(id);
          if (dagState) {
            setInitialNodes(dagState.nodes);
            setInitialEdges(dagState.edges);
          }
        }
      } catch (error) {
        console.error("Failed to fetch play:", error);
        toast({
          title: "Error",
          description: "Failed to load play data.",
          variant: "destructive",
        });
        navigate("/admin/workstream-types");
      } finally {
        setIsLoadingPlay(false);
      }
    };

    fetchPlay();
  }, [id, reset, toast, navigate]);

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateForActivation = useCallback((): boolean => {
    const errs: ValidationError[] = [];

    // Validate team category - check if a parent with sub-groups was selected
    const selectedTeam = teamCategory ? getTeamById(teamCategory) : null;
    if (selectedTeam && hasSubgroups(selectedTeam.id)) {
      errs.push({
        id: "team-subgroup",
        section: "basics",
        field: "team_category",
        message: "This team has sub-groups. Please select a specific group.",
      });
    }

    // Validate workflow DAG
    if (canvasRef.current) {
      const dagErrors = canvasRef.current.validate();
      for (const dagErr of dagErrors) {
        if (dagErr.severity === 'error') {
          errs.push({
            id: dagErr.id,
            section: "workflow",
            field: "dag",
            message: dagErr.message,
          });
        }
      }
    }

    setValidationErrors(errs);
    return errs.length === 0;
  }, [teamCategory, getTeamById, hasSubgroups]);

  const handleErrorClick = (error: ValidationError) => {
    setCurrentStep(error.section);
  };

  const onSubmit = async (data: PlaybookFormData, requestedStatus: "Draft" | "Active") => {
    setValidationErrors([]);

    // When editing, preserve existing status unless explicitly activating
    const status = requestedStatus === "Draft" && isEditing && existingStatus
      ? existingStatus as "Draft" | "Active"
      : requestedStatus;

    if (status === "Active" && !validateForActivation()) {
      const firstError = validationErrors[0];
      if (firstError) {
        setCurrentStep(firstError.section);
      }
      return;
    }

    try {
      const payload = {
        name: data.name,
        display_name: data.display_name,
        description: data.description || null,
        team_category: data.team_category,
        status,
        default_workflow: JSON.stringify({ steps: [] }), // Legacy field - kept for backwards compat
        play_approval_config: playApprovalConfig,
      };

      let workstreamTypeId: string;

      if (isEditing && id) {
        await updateWorkstreamType.mutateAsync({ id, ...payload });
        workstreamTypeId = id;
        toast({
          title: "Play saved",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        const result = await createWorkstreamType.mutateAsync(payload);
        workstreamTypeId = result?.id || "";
        toast({
          title: status === "Active" ? "New play activated successfully" : "Draft saved",
        });
      }

      // Save workflow DAG to relational tables
      if (canvasRef.current && workstreamTypeId) {
        const nodes = canvasRef.current.getNodes();
        const edges = canvasRef.current.getEdges();
        if (nodes.length > 0) {
          const result = await persistence.saveWorkflow(workstreamTypeId, data.name, nodes, edges);
          if (!result) {
            toast({
              title: "Workflow save failed",
              description: persistence.error || "Unknown error saving workflow DAG",
              variant: "destructive",
            });
            return;
          }
        }
      }

      if (isEditing && id) {
        if (status === "Active") {
          navigate("/admin/workstream-types");
        }
      } else {
        if (status === "Active") {
          navigate("/admin/workstream-types");
        } else if (workstreamTypeId) {
          navigate(`/admin/workstream-types/${workstreamTypeId}/edit`, { replace: true });
        }
      }
    } catch (error) {
      console.error("[CreatePlaybook] Save failed:", error);
      toast({
        title: "Error",
        description: "Failed to save play. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsDraft = handleSubmit((data) => onSubmit(data, "Draft"));
  const handleActivate = handleSubmit((data) => onSubmit(data, "Active"));

  const goToNextStep = async () => {
    if (currentStep === "basics") {
      const isValid = await trigger(["name", "display_name", "team_category"]);
      if (isValid) {
        setCompletedSteps((prev) => new Set([...prev, "basics"]));
        setCurrentStep("workflow");
      }
    } else if (currentStep === "workflow") {
      setCompletedSteps((prev) => new Set([...prev, "workflow"]));
      setCurrentStep("approval");
    }
  };

  const goToPrevStep = () => {
    if (currentStep === "workflow") {
      setCurrentStep("basics");
    } else if (currentStep === "approval") {
      setCurrentStep("workflow");
    }
  };

  const handleStepClick = (step: FormStep) => {
    setCurrentStep(step);
  };

  if (isLoadingPlay) {
    return (
      <div className="max-w-[800px] mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Use full width for workflow step, constrained width for other steps
  const isWorkflowStep = currentStep === "workflow";

  return (
    <div className={isWorkflowStep ? "px-6 py-8" : "max-w-[800px] mx-auto py-8"}>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/workstream-types")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Play Library
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">
          {isEditing ? "Edit Play" : "Create New Play"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Define a workflow template for your business processes
        </p>
      </div>

      {/* Stepper */}
      <PlayFormStepper
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
      />

      {/* Validation Summary Panel */}
      <ValidationSummaryPanel
        errors={validationErrors}
        onDismiss={() => setValidationErrors([])}
        onErrorClick={handleErrorClick}
      />

      {/* Form */}
      <form className="space-y-8">
        {/* Step 1: Basic Information */}
        {currentStep === "basics" && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-foreground border-b pb-2">
              Basic Information
            </h2>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Name {!isEditing && <span className="text-destructive">*</span>}
              </Label>
              <p className="text-xs text-muted-foreground italic">
                Internal identifier used in configuration and reporting
              </p>
              <Input
                id="name"
                placeholder="e.g., Enterprise SaaS Play"
                {...register("name")}
                disabled={isEditing}
                className={`${isEditing ? "bg-muted cursor-not-allowed" : ""} ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm font-semibold">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground italic">
                What users see in the interface
              </p>
              <Input
                id="display_name"
                placeholder="e.g., Deal, Matter, Project"
                {...register("display_name")}
                className={errors.display_name ? "border-destructive" : ""}
              />
              {displayNameValue.length > 30 && (
                <p className="text-xs text-amber-600">
                  Display names longer than 30 characters may be truncated
                </p>
              )}
              {errors.display_name && (
                <p className="text-xs text-destructive">
                  {errors.display_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground italic">
                Brief description of when to use this play
              </p>
              <Textarea
                id="description"
                placeholder="Brief description of when to use this play"
                rows={3}
                {...register("description")}
                className={`resize-none ${errors.description ? "border-destructive" : ""}`}
                style={{ minHeight: "76px", maxHeight: "240px" }}
              />
              <div className="flex justify-end">
                <p className="text-xs text-muted-foreground">
                  {descriptionValue.length}/500
                </p>
              </div>
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Assigned Team <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground italic">
                Primary team where this play will be used
              </p>
              <TeamCombobox
                value={teamCategory}
                onValueChange={(value) => setValue("team_category", value)}
                placeholder="Select a team..."
                error={errors.team_category?.message}
                requireSubgroupWhenAvailable={true}
              />
            </div>
          </div>
        )}

        {/* Step 2: Workflow DAG Builder — always mounted, hidden via CSS to preserve ref */}
        <div className={currentStep === "workflow" ? "space-y-2" : "hidden"}>
          <h2 className="text-lg font-medium text-foreground border-b pb-2">
            Workflow Builder
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Design your workflow by dragging bricks from the palette and connecting them.
            Behavior is determined by graph topology: nodes with no incoming edges start first,
            multiple outgoing edges fork in parallel, and conditional edges branch on output.
          </p>
          <WorkflowCanvasSection
            ref={canvasRef}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
          />
        </div>

        {/* Step 3: Play Approval (who approves the play itself) */}
        {currentStep === "approval" && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-foreground border-b pb-2">
              Play Approval
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Approval configuration for individual workflow steps is defined inline within each approval step in the Workflow section.
            </p>
            <PlayApprovalSection
              config={playApprovalConfig}
              onChange={setPlayApprovalConfig}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {currentStep !== "basics" && (
              <Button
                type="button"
                variant="ghost"
                onClick={goToPrevStep}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          <div>
            {currentStep !== "approval" && (
              <Button
                type="button"
                variant="outline"
                onClick={goToNextStep}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin/workstream-types")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={isSubmitting || persistence.isSaving}
          >
            {persistence.isSaving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            onClick={handleActivate}
            disabled={isSubmitting || persistence.isSaving}
          >
            Activate This Play
          </Button>
        </div>
      </form>
    </div>
  );
}
