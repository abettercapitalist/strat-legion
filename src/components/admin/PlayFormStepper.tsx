import { cn } from "@/lib/utils";

export type FormStep = "basics" | "workflow" | "approval";

interface Step {
  id: FormStep;
  name: string;
}

const STEPS: Step[] = [
  { id: "basics", name: "Basic Information" },
  { id: "workflow", name: "Workflow Steps" },
  { id: "approval", name: "Approval" },
];

interface PlayFormStepperProps {
  currentStep: FormStep;
  onStepClick?: (step: FormStep) => void;
  completedSteps: Set<FormStep>;
}

export function PlayFormStepper({ currentStep, onStepClick, completedSteps }: PlayFormStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex gap-1 mb-3">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                (isCurrent || isCompleted || isPast) 
                  ? "bg-primary" 
                  : "bg-muted",
                onStepClick && "cursor-pointer hover:opacity-80"
              )}
            />
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const isCurrent = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "text-sm transition-colors",
                isCurrent 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground",
                onStepClick && "cursor-pointer hover:text-foreground"
              )}
            >
              {index + 1}. {step.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { STEPS };
