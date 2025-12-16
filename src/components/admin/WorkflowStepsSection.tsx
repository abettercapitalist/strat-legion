import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  FileText,
  CheckCircle,
  Bell,
  User,
  HelpCircle,
  Clock,
  GripVertical,
  X,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { StepDocumentsSection, StepDocument } from "./StepDocumentsSection";

export type StepType =
  | "generate_document"
  | "approval_gate"
  | "send_notification"
  | "assign_task"
  | "request_information"
  | "send_reminder";

export type RequirementType = "required_immediate" | "required_deferred" | "optional";

export type RequiredBefore =
  | "pre_deal_approval"
  | "proposal_approval"
  | "closing_approval"
  | "signature"
  | "delivery"
  | "completion";

export type TriggerTiming =
  | "workflow_creation"
  | "after_previous_step"
  | "after_specific_step"
  | "after_pre_deal_approval"
  | "after_proposal_approval"
  | "after_closing_approval"
  | "after_signature"
  | "manual_trigger";

export interface WorkflowStep {
  step_id: string;
  position: number;
  step_type: StepType;
  requirement_type: RequirementType;
  required_before: RequiredBefore | null;
  trigger_timing: TriggerTiming | null;
  trigger_step_id: string | null;
  config: Record<string, unknown>;
  icon: string;
  documents: StepDocument[];
}

export interface StepValidationError {
  stepId: string;
  field: string;
  message: string;
}

interface WorkflowStepsSectionProps {
  steps: WorkflowStep[];
  onStepsChange: (steps: WorkflowStep[]) => void;
  stepErrors?: StepValidationError[];
  onExpandStep?: (stepId: string) => void;
}

const STEP_TYPES: {
  type: StepType;
  label: string;
  icon: typeof FileText;
  emoji: string;
}[] = [
  { type: "generate_document", label: "Generate Document", icon: FileText, emoji: "📄" },
  { type: "approval_gate", label: "Approval Gate", icon: CheckCircle, emoji: "✓" },
  { type: "send_notification", label: "Send Notification", icon: Bell, emoji: "🔔" },
  { type: "assign_task", label: "Assign Task", icon: User, emoji: "👤" },
  { type: "request_information", label: "Request Information", icon: HelpCircle, emoji: "❓" },
  { type: "send_reminder", label: "Send Reminder", icon: Clock, emoji: "⏰" },
];

const REQUIRED_BEFORE_OPTIONS: { value: RequiredBefore; label: string }[] = [
  { value: "pre_deal_approval", label: "Pre-Deal Approval" },
  { value: "proposal_approval", label: "Proposal Approval" },
  { value: "closing_approval", label: "Closing Approval" },
  { value: "signature", label: "Signature" },
  { value: "delivery", label: "Delivery/Handoff" },
  { value: "completion", label: "Workflow Completion" },
];

const TRIGGER_TIMING_OPTIONS: { value: TriggerTiming; label: string }[] = [
  { value: "workflow_creation", label: "Workflow creation" },
  { value: "after_previous_step", label: "After previous step completes" },
  { value: "after_specific_step", label: "After [specific step] completes" },
  { value: "after_pre_deal_approval", label: "After pre-deal approval" },
  { value: "after_proposal_approval", label: "After proposal approval" },
  { value: "after_closing_approval", label: "After closing approval" },
  { value: "after_signature", label: "After signature" },
  { value: "manual_trigger", label: "Manual trigger only" },
];

const GATE_TYPE_OPTIONS = [
  { value: "pre_deal", label: "Pre-Deal" },
  { value: "proposal", label: "Proposal" },
  { value: "closing", label: "Closing" },
  { value: "custom", label: "Custom" },
];

const TEAM_OPTIONS = [
  { value: "sales", label: "Sales" },
  { value: "law", label: "Law" },
  { value: "finance", label: "Finance" },
  { value: "pro_services", label: "Pro Services" },
  { value: "general_counsel", label: "General Counsel" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "counterparty", label: "Prospect/Customer" },
];

export function WorkflowStepsSection({
  steps,
  onStepsChange,
  stepErrors = [],
  onExpandStep,
}: WorkflowStepsSectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Auto-expand steps with errors
  const expandStepWithErrors = (stepId: string) => {
    setExpandedSteps((prev) => new Set([...prev, stepId]));
  };

  // Helper to get errors for a specific step
  const getStepErrors = (stepId: string) => 
    stepErrors.filter((e) => e.stepId === stepId);

  // Helper to check if step has errors
  const stepHasErrors = (stepId: string) => 
    stepErrors.some((e) => e.stepId === stepId);

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const addStep = (type: StepType) => {
    const stepInfo = STEP_TYPES.find((s) => s.type === type)!;
    const newStep: WorkflowStep = {
      step_id: uuidv4(),
      position: steps.length + 1,
      step_type: type,
      requirement_type: "required_immediate",
      required_before: null,
      trigger_timing: "workflow_creation",
      trigger_step_id: null,
      config: {},
      icon: stepInfo.emoji,
      documents: [],
    };
    onStepsChange([...steps, newStep]);
    // Auto-expand newly added step
    setExpandedSteps((prev) => new Set([...prev, newStep.step_id]));
  };

  const removeStep = (stepId: string) => {
    const filtered = steps.filter((s) => s.step_id !== stepId);
    const reordered = filtered.map((s, idx) => ({ ...s, position: idx + 1 }));
    onStepsChange(reordered);
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    onStepsChange(
      steps.map((s) => (s.step_id === stepId ? { ...s, ...updates } : s))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedStep = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedStep);

    const reordered = newSteps.map((s, idx) => ({ ...s, position: idx + 1 }));
    onStepsChange(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getStepLabel = (type: StepType) => {
    return STEP_TYPES.find((s) => s.type === type)?.label || type;
  };

  return (
    <div className="space-y-6" style={{ marginTop: "48px" }}>
      <div>
        <h2 className="text-lg font-medium text-foreground border-b pb-2">
          Workflow Steps
        </h2>
        <p className="text-xs text-muted-foreground italic mt-2">
          Define the sequence of actions that happen in this play
        </p>
      </div>

      {/* Add Step Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Step
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {STEP_TYPES.map((step) => (
            <DropdownMenuItem
              key={step.type}
              onClick={() => addStep(step.type)}
              className="gap-2"
            >
              <span>{step.emoji}</span>
              {step.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-muted-foreground">
            Conditional Logic (Phase 2)
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-muted-foreground">
            External Integration (Phase 2)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tip - shown when steps exist */}
      {steps.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Steps execute in order listed. Drag to reorder.</span>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.step_id);
          const hasErrors = stepHasErrors(step.step_id);
          const errors = getStepErrors(step.step_id);
          
          return (
            <Card
              key={step.step_id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 ${
                draggedIndex === index ? "opacity-50 border-primary" : ""
              } ${hasErrors ? "border-destructive bg-destructive/5" : ""}`}
            >
              {/* Step Header */}
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => toggleStepExpanded(step.step_id)}
              >
                <div
                  className="cursor-grab text-muted-foreground hover:text-foreground"
                  title="Drag to reorder"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-lg">{step.icon}</span>
                <span className="font-medium text-foreground">
                  Step {step.position}: {getStepLabel(step.step_type)}
                </span>
                {/* Error badge when collapsed */}
                {hasErrors && !isExpanded && (
                  <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                    {errors.length} {errors.length === 1 ? "issue" : "issues"}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStep(step.step_id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Inline errors summary when collapsed */}
              {hasErrors && !isExpanded && (
                <div className="pl-8 mt-2">
                  <ul className="text-xs text-destructive space-y-0.5">
                    {errors.slice(0, 2).map((error) => (
                      <li key={error.field}>• {error.message}</li>
                    ))}
                    {errors.length > 2 && (
                      <li>• and {errors.length - 2} more...</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Step Configuration - Collapsible */}
              {isExpanded && (
                <div className="pl-8 space-y-4 mt-4">
                  {/* Step-specific fields */}
                  <StepTypeFields
                    step={step}
                    allSteps={steps}
                    onUpdate={(updates) => updateStep(step.step_id, updates)}
                    errors={errors}
                  />

                  {/* Universal Timing Field */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-semibold">
                      Timing <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup
                      value={step.requirement_type}
                      onValueChange={(value) =>
                        updateStep(step.step_id, {
                          requirement_type: value as RequirementType,
                          required_before:
                            value === "required_deferred" ? "completion" : null,
                        })
                      }
                      className="space-y-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="required_immediate"
                            id={`${step.step_id}-immediate`}
                          />
                          <Label
                            htmlFor={`${step.step_id}-immediate`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Required (immediate at trigger)
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground italic ml-6">
                          Executes automatically, cannot be skipped
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="required_deferred"
                            id={`${step.step_id}-deferred`}
                          />
                          <Label
                            htmlFor={`${step.step_id}-deferred`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Required (must complete before...)
                          </Label>
                        </div>
                        {step.requirement_type === "required_deferred" && (
                          <div className="ml-6">
                            <Select
                              value={step.required_before || "completion"}
                              onValueChange={(value) =>
                                updateStep(step.step_id, {
                                  required_before: value as RequiredBefore,
                                })
                              }
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select milestone" />
                              </SelectTrigger>
                              <SelectContent>
                                {REQUIRED_BEFORE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground italic ml-6">
                          User can complete anytime, but workflow cannot progress
                          without it
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="optional"
                            id={`${step.step_id}-optional`}
                          />
                          <Label
                            htmlFor={`${step.step_id}-optional`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Optional (not required)
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground italic ml-6">
                          User decides if/when to include this step
                        </p>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Universal Trigger Field */}
                  {step.requirement_type === "required_immediate" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Trigger <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={step.trigger_timing || "workflow_creation"}
                        onValueChange={(value) =>
                          updateStep(step.step_id, {
                            trigger_timing: value as TriggerTiming,
                            trigger_step_id:
                              value === "after_specific_step"
                                ? steps[0]?.step_id || null
                                : null,
                          })
                        }
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_TIMING_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {step.trigger_timing === "after_specific_step" && (
                        <Select
                          value={step.trigger_step_id || ""}
                          onValueChange={(value) =>
                            updateStep(step.step_id, { trigger_step_id: value })
                          }
                        >
                          <SelectTrigger className="w-full max-w-sm mt-2">
                            <SelectValue placeholder="Select step" />
                          </SelectTrigger>
                          <SelectContent>
                            {steps
                              .filter((s) => s.step_id !== step.step_id)
                              .map((s) => (
                                <SelectItem key={s.step_id} value={s.step_id}>
                                  Step {s.position}: {getStepLabel(s.step_type)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Documents for this step */}
                  <div className="pt-4 border-t">
                    <StepDocumentsSection
                      documents={step.documents || []}
                      onDocumentsChange={(docs) =>
                        updateStep(step.step_id, { documents: docs })
                      }
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {steps.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No workflow steps defined yet.</p>
          <p className="text-sm">Add steps to define the sequence of actions.</p>
        </div>
      )}
    </div>
  );
}

// Step-specific configuration fields
function StepTypeFields({
  step,
  allSteps,
  onUpdate,
  errors = [],
}: {
  step: WorkflowStep;
  allSteps: WorkflowStep[];
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  errors?: StepValidationError[];
}) {
  const updateConfig = (key: string, value: unknown) => {
    onUpdate({ config: { ...step.config, [key]: value } });
  };

  const getFieldError = (field: string) => 
    errors.find((e) => e.field === field)?.message;

  switch (step.step_type) {
    case "generate_document":
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Template <span className="text-destructive">*</span>
          </Label>
          <Select
            value={(step.config.template_id as string) || ""}
            onValueChange={(value) => updateConfig("template_id", value)}
          >
            <SelectTrigger className={`w-full max-w-sm ${getFieldError("template_id") ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
              <SelectItem value="msa">Master Service Agreement</SelectItem>
              <SelectItem value="sow">Statement of Work</SelectItem>
              <SelectItem value="order_form">Order Form</SelectItem>
            </SelectContent>
          </Select>
          {getFieldError("template_id") && (
            <p className="text-xs text-destructive">{getFieldError("template_id")}</p>
          )}
        </div>
      );

    case "approval_gate":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Gate Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={(step.config.gate_type as string) || ""}
              onValueChange={(value) => updateConfig("gate_type", value)}
            >
              <SelectTrigger className={`w-full max-w-sm ${getFieldError("gate_type") ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Select gate type" />
              </SelectTrigger>
              <SelectContent>
                {GATE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("gate_type") && (
              <p className="text-xs text-destructive">{getFieldError("gate_type")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Approvers</Label>
            <Select
              value={(step.config.approvers as string) || ""}
              onValueChange={(value) => updateConfig("approvers", value)}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select approvers" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">SLA (hours)</Label>
            <Input
              type="number"
              placeholder="e.g., 24"
              value={(step.config.sla_hours as string) || ""}
              onChange={(e) => updateConfig("sla_hours", e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      );

    case "send_notification":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Notify <span className="text-destructive">*</span>
            </Label>
            <Select
              value={(step.config.notify_team as string) || ""}
              onValueChange={(value) => updateConfig("notify_team", value)}
            >
              <SelectTrigger className={`w-full max-w-sm ${getFieldError("notify_team") ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Select team/role" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("notify_team") && (
              <p className="text-xs text-destructive">{getFieldError("notify_team")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Message Template</Label>
            <Textarea
              placeholder="Enter notification message..."
              value={(step.config.message as string) || ""}
              onChange={(e) => updateConfig("message", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Channels</Label>
            <div className="flex gap-4">
              {["In-app", "Email", "Slack"].map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${step.step_id}-channel-${channel}`}
                    checked={
                      ((step.config.channels as string[]) || []).includes(
                        channel.toLowerCase()
                      )
                    }
                    onCheckedChange={(checked) => {
                      const current = (step.config.channels as string[]) || [];
                      const updated = checked
                        ? [...current, channel.toLowerCase()]
                        : current.filter((c) => c !== channel.toLowerCase());
                      updateConfig("channels", updated);
                    }}
                  />
                  <Label
                    htmlFor={`${step.step_id}-channel-${channel}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {channel}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "assign_task":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Assign To <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground italic">
              Team or role responsible for completing this task
            </p>
            <Select
              value={(step.config.assign_to as string) || ""}
              onValueChange={(value) => {
                updateConfig("assign_to", value);
                if (value !== "counterparty") {
                  updateConfig("internal_owner", "");
                }
              }}
            >
              <SelectTrigger className={`w-full max-w-sm ${getFieldError("assign_to") ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Select team/role" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("assign_to") && (
              <p className="text-xs text-destructive">{getFieldError("assign_to")}</p>
            )}
          </div>
          
          {/* Internal Owner - shown when counterparty is selected */}
          {(step.config.assign_to as string) === "counterparty" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Internal Owner <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground italic">
                Internal team that can assist or complete on behalf of the counterparty
              </p>
              <Select
                value={(step.config.internal_owner as string) || ""}
                onValueChange={(value) => updateConfig("internal_owner", value)}
              >
                <SelectTrigger className={`w-full max-w-sm ${getFieldError("internal_owner") ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select internal team/role" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_OPTIONS.filter(opt => opt.value !== "counterparty").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError("internal_owner") && (
                <p className="text-xs text-destructive">{getFieldError("internal_owner")}</p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Task Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Describe the task..."
              value={(step.config.description as string) || ""}
              onChange={(e) => updateConfig("description", e.target.value)}
              rows={2}
              className={`resize-none ${getFieldError("description") ? "border-destructive" : ""}`}
            />
            {getFieldError("description") && (
              <p className="text-xs text-destructive">{getFieldError("description")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Due Date <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground italic">
              Number of days after step starts
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="e.g., 3"
                value={(step.config.due_days as string) || ""}
                onChange={(e) => updateConfig("due_days", e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
        </div>
      );

    case "request_information":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Request From <span className="text-destructive">*</span>
            </Label>
            <Select
              value={(step.config.request_from as string) || ""}
              onValueChange={(value) => updateConfig("request_from", value)}
            >
              <SelectTrigger className={`w-full max-w-sm ${getFieldError("request_from") ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Select team/role" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("request_from") && (
              <p className="text-xs text-destructive">{getFieldError("request_from")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Information Needed <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Describe what information is needed..."
              value={(step.config.info_needed as string) || ""}
              onChange={(e) => updateConfig("info_needed", e.target.value)}
              rows={2}
              className={`resize-none ${getFieldError("info_needed") ? "border-destructive" : ""}`}
            />
            {getFieldError("info_needed") && (
              <p className="text-xs text-destructive">{getFieldError("info_needed")}</p>
            )}
          </div>
        </div>
      );

    case "send_reminder":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Remind <span className="text-destructive">*</span>
            </Label>
            <Select
              value={(step.config.remind_who as string) || ""}
              onValueChange={(value) => updateConfig("remind_who", value)}
            >
              <SelectTrigger className={`w-full max-w-sm ${getFieldError("remind_who") ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Select who to remind" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("remind_who") && (
              <p className="text-xs text-destructive">{getFieldError("remind_who")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              About <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="What is the reminder about..."
              value={(step.config.about as string) || ""}
              onChange={(e) => updateConfig("about", e.target.value)}
              rows={2}
              className={`resize-none ${getFieldError("about") ? "border-destructive" : ""}`}
            />
            {getFieldError("about") && (
              <p className="text-xs text-destructive">{getFieldError("about")}</p>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}
