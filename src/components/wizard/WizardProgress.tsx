import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";

interface Step {
  id: number;
  name: string;
  salesOnly?: boolean;
}

const allSteps: Step[] = [
  { id: 1, name: "Counterparty" },
  { id: 2, name: "Objective" },
  { id: 3, name: "Options" },
  { id: 4, name: "Terms", salesOnly: true },
  { id: 5, name: "Review" },
];

interface WizardProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  canNavigateTo?: (step: number) => boolean;
}

export function WizardProgress({ currentStep, onStepClick, canNavigateTo }: WizardProgressProps) {
  const { isSalesModule, getDisplayStep } = useWorkstreamWizard();
  
  // Filter out Terms step for non-sales modules
  const steps = allSteps.filter(step => !step.salesOnly || isSalesModule);
  
  const displayStep = getDisplayStep(currentStep);
  
  return (
    <div className="w-full">
      <div className="text-sm text-muted-foreground mb-4">
        Step {displayStep} of {steps.length}
      </div>
      
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = canNavigateTo ? canNavigateTo(step.id) : isCompleted;
            
            // Display number is 1-indexed position in filtered array
            const displayNumber = stepIdx + 1;
            
            return (
              <li key={step.name} className={cn("relative", stepIdx !== steps.length - 1 && "pr-8 sm:pr-20 flex-1")}>
                <div className="flex items-center">
                  <button
                    type="button"
                    disabled={!isClickable && !isCurrent}
                    onClick={() => isClickable && onStepClick?.(step.id)}
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      isCompleted && "bg-primary hover:bg-primary/90 cursor-pointer",
                      isCurrent && "border-2 border-primary bg-background",
                      !isCompleted && !isCurrent && "border-2 border-muted bg-background",
                      isClickable && !isCurrent && "cursor-pointer"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {displayNumber}
                      </span>
                    )}
                  </button>
                  
                  {stepIdx !== steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-4 left-8 -ml-px h-0.5 w-full sm:w-20",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
                
                <span
                  className={cn(
                    "absolute -bottom-6 left-0 w-max text-xs font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
