import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormStep = "basics" | "workflow" | "approval";

interface Step {
  id: FormStep;
  name: string;
  description: string;
}

const STEPS: Step[] = [
  { id: "basics", name: "Basic Information", description: "Name, team, description" },
  { id: "workflow", name: "Workflow Steps", description: "Define actions and sequence" },
  { id: "approval", name: "Approval Workflow", description: "Set approval requirements" },
];

interface PlayFormStepperProps {
  currentStep: FormStep;
  onStepClick?: (step: FormStep) => void;
  completedSteps: Set<FormStep>;
}

export function PlayFormStepper({ currentStep, onStepClick, completedSteps }: PlayFormStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;

          return (
            <li key={step.id} className={cn("relative", index !== STEPS.length - 1 && "pr-8 sm:pr-20 flex-1")}>
              {/* Connector line */}
              {index !== STEPS.length - 1 && (
                <div className="absolute top-4 left-8 -right-4 sm:-right-12 h-0.5 bg-border">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isPast || isCompleted ? "bg-primary" : "bg-transparent"
                    )}
                    style={{ width: isPast || isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  "group flex items-center",
                  onStepClick && "cursor-pointer"
                )}
              >
                {/* Step circle */}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isCompleted && !isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && "border-muted-foreground/30 bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </span>

                {/* Step label */}
                <span className="ml-3 hidden sm:flex flex-col items-start">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { STEPS };
