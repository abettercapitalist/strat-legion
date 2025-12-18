import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWorkstreamTypes } from "@/hooks/useWorkstreamTypes";
import { supabase } from "@/integrations/supabase/client";
import {
  WorkflowStepsSection,
  WorkflowStep,
  StepValidationError,
} from "@/components/admin/WorkflowStepsSection";
import { ApprovalWorkflowSection } from "@/components/admin/ApprovalWorkflowSection";
import { PlayFormStepper, FormStep } from "@/components/admin/PlayFormStepper";
import { ValidationSummaryPanel, ValidationError } from "@/components/admin/ValidationSummaryPanel";

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
  team_category: z.enum(["Sales", "Law", "Finance", "Pro Services", "Other"], {
    required_error: "Assigned team is required",
  }),
});

type PlaybookFormData = z.infer<typeof playbookSchema>;

const TEAM_OPTIONS = [
  { value: "Sales", label: "Sales" },
  { value: "Law", label: "Law" },
  { value: "Finance", label: "Finance" },
  { value: "Pro Services", label: "Pro Services" },
  { value: "Other", label: "Other" },
] as const;

export default function CreatePlaybook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { createWorkstreamType, updateWorkstreamType } = useWorkstreamTypes();
  const isEditing = Boolean(id);
  
  const [currentStep, setCurrentStep] = useState<FormStep>("basics");
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [selectedApprovalTemplateId, setSelectedApprovalTemplateId] = useState<string | null>(null);
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);

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
          reset({
            name: data.name,
            display_name: data.display_name || "",
            description: data.description || "",
            team_category: data.team_category as PlaybookFormData["team_category"],
          });

          setSelectedApprovalTemplateId(data.approval_template_id || null);

          // Parse workflow steps from default_workflow JSON
          if (data.default_workflow) {
            try {
              const workflow = JSON.parse(data.default_workflow);
              if (workflow.steps && Array.isArray(workflow.steps)) {
                setWorkflowSteps(workflow.steps);
              }
            } catch (e) {
              console.error("Failed to parse workflow:", e);
            }
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
  const [stepErrors, setStepErrors] = useState<StepValidationError[]>([]);

  const STEP_VALIDATION_RULES: Record<string, { field: string; label: string; conditional?: (config: Record<string, unknown>) => boolean }[]> = {
    generate_document: [{ field: "template_id", label: "Template" }],
    approval_gate: [{ field: "gate_type", label: "Gate Type" }],
    send_notification: [{ field: "notify_team", label: "Recipient" }],
    assign_task: [
      { field: "assign_to", label: "Assignee" },
      { field: "description", label: "Task Description" },
      { field: "internal_owner", label: "Internal Owner", conditional: (config) => config.assign_to === "counterparty" },
    ],
    request_information: [
      { field: "request_from", label: "Request From" },
      { field: "info_needed", label: "Information Needed" },
    ],
    send_reminder: [
      { field: "remind_who", label: "Remind Who" },
      { field: "about", label: "About" },
    ],
  };

  const getStepLabel = (type: string) => {
    const labels: Record<string, string> = {
      generate_document: "Generate Document",
      approval_gate: "Approval Gate",
      send_notification: "Send Notification",
      assign_task: "Assign Task",
      request_information: "Request Information",
      send_reminder: "Send Reminder",
    };
    return labels[type] || type;
  };

  const validateForActivation = useCallback((): boolean => {
    const errors: ValidationError[] = [];
    const stepErrs: StepValidationError[] = [];

    // Validate workflow steps have at least one immediate step
    const hasImmediateStep = workflowSteps.some((step) => step.requirement_type === "required_immediate");
    if (!hasImmediateStep) {
      errors.push({
        id: "workflow-immediate",
        section: "workflow",
        field: "requirement_type",
        message: "At least one step must be 'Required (immediate)' to activate",
      });
    }

    // Validate each step's required fields
    workflowSteps.forEach((step, index) => {
      const rules = STEP_VALIDATION_RULES[step.step_type] || [];
      rules.forEach((rule) => {
        const shouldValidate = !rule.conditional || rule.conditional(step.config);
        if (shouldValidate && !step.config[rule.field]) {
          const error: ValidationError = {
            id: `${step.step_id}-${rule.field}`,
            section: "workflow",
            stepId: step.step_id,
            stepNumber: index + 1,
            stepType: getStepLabel(step.step_type),
            field: rule.field,
            message: `${rule.label} is required`,
          };
          errors.push(error);
          stepErrs.push({ stepId: step.step_id, field: rule.field, message: `${rule.label} is required` });
        }
      });

      // Validate trigger_step_id when after_specific_step is selected
      if (step.trigger_timing === "after_specific_step" && !step.trigger_step_id) {
        errors.push({
          id: `${step.step_id}-trigger_step_id`,
          section: "workflow",
          stepId: step.step_id,
          stepNumber: index + 1,
          stepType: getStepLabel(step.step_type),
          field: "trigger_step_id",
          message: "Trigger step must be selected",
        });
        stepErrs.push({ stepId: step.step_id, field: "trigger_step_id", message: "Trigger step must be selected" });
      }
    });

    // Validate approval template
    if (!selectedApprovalTemplateId) {
      errors.push({
        id: "approval-template",
        section: "approval",
        field: "approval_template_id",
        message: "An approval route is required to activate",
      });
    }

    setValidationErrors(errors);
    setStepErrors(stepErrs);
    return errors.length === 0;
  }, [workflowSteps, selectedApprovalTemplateId]);

  const handleErrorClick = (error: ValidationError) => {
    setCurrentStep(error.section);
  };

  const onSubmit = async (data: PlaybookFormData, status: "Draft" | "Active") => {
    setValidationErrors([]);
    setStepErrors([]);
    
    if (status === "Active" && !validateForActivation()) {
      const firstError = validationErrors[0];
      if (firstError) {
        setCurrentStep(firstError.section);
      }
      // Validation errors shown via ValidationSummaryPanel - no toast needed
      return;
    }

    try {
      const payload = {
        name: data.name,
        display_name: data.display_name,
        description: data.description || null,
        team_category: data.team_category,
        status,
        approval_template_id: selectedApprovalTemplateId,
        default_workflow: JSON.stringify({
          steps: workflowSteps,
        }),
      };

      if (isEditing && id) {
        await updateWorkstreamType.mutateAsync({ id, ...payload });
        toast({
          title: "Play updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        await createWorkstreamType.mutateAsync(payload);
        toast({
          title: status === "Active" ? "New play activated successfully" : "Play saved as draft",
        });
      }
      navigate("/admin/workstream-types");
    } catch (error) {
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
    // Allow navigation to completed steps or current step
    const stepOrder: FormStep[] = ["basics", "workflow", "approval"];
    const targetIndex = stepOrder.indexOf(step);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (targetIndex <= currentIndex || completedSteps.has(step)) {
      setCurrentStep(step);
    }
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

  return (
    <div className="max-w-[800px] mx-auto py-8">
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
                Name <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground italic">
                Internal identifier used in configuration and reporting
              </p>
              <Input
                id="name"
                placeholder="e.g., Enterprise SaaS Play"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
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
              {displayNameValue.length > 20 && (
                <p className="text-xs text-amber-600">
                  Display names longer than 20 characters may be truncated
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
              <RadioGroup
                value={teamCategory}
                onValueChange={(value) =>
                  setValue("team_category", value as PlaybookFormData["team_category"])
                }
                className="flex flex-wrap gap-4"
              >
                {TEAM_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.team_category && (
                <p className="text-xs text-destructive">
                  {errors.team_category.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Workflow Steps */}
        {currentStep === "workflow" && (
          <div className="space-y-2">
            <WorkflowStepsSection
              steps={workflowSteps}
              onStepsChange={setWorkflowSteps}
              stepErrors={stepErrors}
            />
          </div>
        )}

        {/* Step 3: Approval Workflow */}
        {currentStep === "approval" && (
          <div className="space-y-2">
            <ApprovalWorkflowSection
              selectedTemplateId={selectedApprovalTemplateId}
              onTemplateChange={setSelectedApprovalTemplateId}
            />
            {validationErrors.some(e => e.section === "approval") && (
              <p className="text-xs text-destructive">
                {validationErrors.find(e => e.section === "approval")?.message}
              </p>
            )}
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
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handleActivate}
            disabled={isSubmitting}
          >
            Activate This Play
          </Button>
        </div>
      </form>
    </div>
  );
}
