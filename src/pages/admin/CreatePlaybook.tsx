import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useWorkstreamTypes } from "@/hooks/useWorkstreamTypes";
import {
  WorkflowStepsSection,
  WorkflowStep,
} from "@/components/admin/WorkflowStepsSection";
import { ApprovalWorkflowSection } from "@/components/admin/ApprovalWorkflowSection";
import {
  RequiredDocumentsSection,
  RequiredDocument,
} from "@/components/admin/RequiredDocumentsSection";

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
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [selectedApprovalTemplateId, setSelectedApprovalTemplateId] = useState<string | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
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

  const validateForActivation = (): boolean => {
    // Check for at least one immediate step
    const hasImmediateStep = workflowSteps.some(
      (step) => step.requirement_type === "required_immediate"
    );
    if (!hasImmediateStep && workflowSteps.length > 0) {
      toast({
        title: "Validation Error",
        description:
          "At least one step must be set as 'Required (immediate)' to activate.",
        variant: "destructive",
      });
      return false;
    }
    
    // Check for approval template
    if (!selectedApprovalTemplateId) {
      toast({
        title: "Validation Error",
        description: "An approval template is required to activate.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const onSubmit = async (
    data: PlaybookFormData,
    status: "Draft" | "Active"
  ) => {
    if (status === "Active" && !validateForActivation()) {
      return;
    }

    try {
      const payload = {
        name: data.name,
        display_name: data.display_name,
        description: data.description || null,
        team_category: data.team_category,
        status,
        default_workflow: JSON.stringify({
          steps: workflowSteps,
          approval_template_id: selectedApprovalTemplateId,
          required_documents: requiredDocuments,
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
          title: "Play created",
          description: `${data.name} has been ${
            status === "Draft" ? "saved as draft" : "activated"
          }.`,
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

      {/* Form */}
      <form className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-foreground border-b pb-2">
            Basic Information
          </h2>

          {/* Name Field */}
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

          {/* Display Name Field */}
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

          {/* Description Field */}
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
              className={`resize-none ${
                errors.description ? "border-destructive" : ""
              }`}
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

          {/* Assigned Team Field */}
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
                setValue(
                  "team_category",
                  value as PlaybookFormData["team_category"]
                )
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

        {/* Section 2: Workflow Steps */}
        <WorkflowStepsSection
          steps={workflowSteps}
          onStepsChange={setWorkflowSteps}
        />

        {/* Section 3: Approval Workflow */}
        <ApprovalWorkflowSection
          selectedTemplateId={selectedApprovalTemplateId}
          onTemplateChange={setSelectedApprovalTemplateId}
        />

        {/* Section 4: Required Documents */}
        <RequiredDocumentsSection
          documents={requiredDocuments}
          onDocumentsChange={setRequiredDocuments}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
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