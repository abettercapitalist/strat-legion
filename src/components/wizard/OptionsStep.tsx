import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare } from "lucide-react";
import { useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  requirement_type: "required" | "optional" | "required_deferred";
  required_before?: string;
}

interface OptionsStepProps {
  playId: string;
  displayName: string;
}

export function OptionsStep({ playId, displayName }: OptionsStepProps) {
  const { state, setOptionalSteps } = useWorkstreamWizard();
  const [optionalSteps, setOptionalStepsLocal] = useState<WorkflowStep[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>(state.optional_steps);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflowSteps = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("workstream_types")
          .select("default_workflow")
          .eq("id", playId)
          .single();

        if (error) throw error;

        // Parse workflow_steps from the default_workflow field (stored as JSON string)
        let steps: WorkflowStep[] = [];
        if (data?.default_workflow) {
          try {
            const parsed = JSON.parse(data.default_workflow);
            if (Array.isArray(parsed)) {
              steps = parsed;
            } else if (parsed.steps && Array.isArray(parsed.steps)) {
              steps = parsed.steps;
            }
          } catch {
            // If parsing fails, default_workflow might be a simple string
            steps = [];
          }
        }

        // Filter for optional and required_deferred steps
        const optional = steps.filter(
          (step) => step.requirement_type === "optional" || step.requirement_type === "required_deferred"
        );
        setOptionalStepsLocal(optional);
      } catch (error) {
        console.error("Error fetching workflow steps:", error);
        setOptionalStepsLocal([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowSteps();
  }, [playId]);

  // Sync with wizard state
  useEffect(() => {
    setOptionalSteps(selectedSteps);
  }, [selectedSteps, setOptionalSteps]);

  const handleToggle = (stepId: string) => {
    setSelectedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (optionalSteps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <CheckSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">No Optional Steps</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              This {displayName.toLowerCase()} type has no optional steps. 
              All steps will be included automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          This {displayName.toLowerCase()} type includes optional steps.
          Select which to include:
        </p>
      </div>

      <div className="space-y-3">
        {optionalSteps.map((step) => {
          const isSelected = selectedSteps.includes(step.id);
          
          return (
            <label
              key={step.id}
              className={`
                flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200
                ${isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                }
              `}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(step.id)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.name}</span>
                  {step.requirement_type === "required_deferred" && step.required_before && (
                    <Badge variant="secondary" className="text-xs">
                      Required before {step.required_before}
                    </Badge>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
