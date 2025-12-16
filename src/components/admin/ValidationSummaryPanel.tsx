import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ValidationError {
  id: string;
  section: "basics" | "workflow" | "approval";
  stepId?: string;
  stepNumber?: number;
  stepType?: string;
  field: string;
  message: string;
}

interface ValidationSummaryPanelProps {
  errors: ValidationError[];
  onDismiss: () => void;
  onErrorClick: (error: ValidationError) => void;
}

export function ValidationSummaryPanel({
  errors,
  onDismiss,
  onErrorClick,
}: ValidationSummaryPanelProps) {
  if (errors.length === 0) return null;

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.section]) {
      acc[error.section] = [];
    }
    acc[error.section].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  const sectionLabels: Record<string, string> = {
    basics: "Basic Information",
    workflow: "Workflow Steps",
    approval: "Approval Workflow",
  };

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-destructive">
                Cannot activate play
              </h3>
              <p className="text-sm text-destructive/80">
                {errors.length} {errors.length === 1 ? "issue" : "issues"} found. Please fix the following:
              </p>
            </div>
            
            <div className="space-y-3">
              {Object.entries(groupedErrors).map(([section, sectionErrors]) => (
                <div key={section} className="space-y-1">
                  <p className="text-xs font-medium text-destructive/70 uppercase tracking-wide">
                    {sectionLabels[section]}
                  </p>
                  <ul className="space-y-1">
                    {sectionErrors.map((error) => (
                      <li key={error.id}>
                        <button
                          type="button"
                          onClick={() => onErrorClick(error)}
                          className="text-sm text-destructive hover:underline text-left"
                        >
                          {error.stepNumber 
                            ? `Step ${error.stepNumber}: ${error.stepType} — ${error.message}`
                            : error.message
                          }
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
