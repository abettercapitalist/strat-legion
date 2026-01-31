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
  const { isSalesModule, hasOptionalSteps, getDisplayStep } = useWorkstreamWizard();

  const steps = allSteps.filter(step => {
    if (step.salesOnly && !isSalesModule) return false;
    if (step.id === 3 && !hasOptionalSteps) return false;
    return true;
  });
  const displayStep = getDisplayStep(currentStep);

  return (
    <div className="w-full">
      <div className="text-sm text-muted-foreground mb-3">
        Step {displayStep} of {steps.length}
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = canNavigateTo ? canNavigateTo(step.id) : isCompleted;

          return (
            <button
              key={step.name}
              type="button"
              disabled={!isClickable && !isCurrent}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={cn(
                "flex-1 group relative",
                (isClickable && !isCurrent) && "cursor-pointer"
              )}
            >
              {/* Bar segment */}
              <div
                className={cn(
                  "h-2 rounded-full transition-colors",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-primary/60",
                  !isCompleted && !isCurrent && "bg-muted",
                  isClickable && !isCurrent && "hover:bg-primary/70"
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  "block text-xs mt-1.5 text-left transition-colors",
                  isCurrent ? "text-primary font-medium" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
