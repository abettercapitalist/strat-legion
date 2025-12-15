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
      <div className="flex gap-1">
      {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isActive = isCurrent || isCompleted;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "flex-1 h-8 rounded-md px-3 flex items-center text-sm transition-colors",
                isActive ? "bg-primary" : "bg-muted",
                isActive ? "text-primary-foreground" : "text-muted-foreground",
                isCurrent && "font-medium",
                onStepClick && "cursor-pointer hover:opacity-90"
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
