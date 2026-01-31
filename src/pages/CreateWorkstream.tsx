import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WorkstreamWizardProvider, useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { CounterpartyStep } from "@/components/wizard/CounterpartyStep";
import { ObjectiveStep } from "@/components/wizard/ObjectiveStep";
import { OptionsStep } from "@/components/wizard/OptionsStep";
import { TermsStep } from "@/components/wizard/TermsStep";
import { ReviewStep } from "@/components/wizard/ReviewStep";

// Module configuration
const moduleConfig: Record<string, { displayName: string; itemName: string }> = {
  sales: { displayName: "Sales", itemName: "Deal" },
  law: { displayName: "Law", itemName: "Matter" },
  finance: { displayName: "Finance", itemName: "Project" },
  "pro-services": { displayName: "Pro Services", itemName: "Engagement" },
};

function WizardContent({ module, playName }: { module: string; playName: string }) {
  const navigate = useNavigate();
  const { state, nextStep, prevStep, goToStep, canProceed, isSalesModule, hasOptionalSteps, totalSteps, getDisplayStep } = useWorkstreamWizard();
  const config = moduleConfig[module];

  const handleContinue = () => {
    if (canProceed(state.current_step)) {
      nextStep();
    }
  };

  const handleCancel = () => {
    navigate(`/${module}/new`);
  };

  // Determine if user can navigate to a step (using actual step numbers)
  const canNavigateTo = (step: number): boolean => {
    if (!hasOptionalSteps && step === 3) return false;
    if (!isSalesModule && step === 4) return false;
    // Can always go back to completed steps
    if (step < state.current_step) return true;
    // Can only go forward if current step is valid
    if (step === state.current_step + 1) return canProceed(state.current_step);
    return false;
  };

  const renderStep = () => {
    switch (state.current_step) {
      case 1:
        return <CounterpartyStep itemName={config.itemName} />;
      case 2:
        return <ObjectiveStep module={module} displayName={config.itemName} />;
      case 3:
        return <OptionsStep playId={state.play_id} displayName={config.itemName} />;
      case 4:
        // This should only render for sales module
        return <TermsStep />;
      case 5:
        return (
          <ReviewStep 
            module={module} 
            displayName={config.itemName} 
            playId={state.play_id} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/${module}`}>{config.displayName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/${module}/new`}>New {config.itemName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{playName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Progress indicator */}
      <div className="pb-8">
        <WizardProgress
          currentStep={state.current_step}
          onStepClick={goToStep}
          canNavigateTo={canNavigateTo}
        />
      </div>

      {/* Step content */}
      <div className="max-w-2xl">{renderStep()}</div>

      {/* Navigation buttons - hide on Review step (step 5) which has its own buttons */}
      {state.current_step < 5 && (
        <div className="flex items-center justify-between pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll lose all progress on this {config.itemName.toLowerCase()}. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>Discard</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-3">
            {state.current_step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}

            <Button onClick={handleContinue} disabled={!canProceed(state.current_step)}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateWorkstreamProps {
  module?: string;
}

export default function CreateWorkstream({ module: moduleProp }: CreateWorkstreamProps) {
  const { module: moduleParam, playId } = useParams<{ module: string; playId: string }>();
  const module = moduleProp || moduleParam;
  const navigate = useNavigate();

  const config = module ? moduleConfig[module] : null;

  // Fetch the play details
  const { data: play, isLoading, error } = useQuery({
    queryKey: ["play", playId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstream_types")
        .select("id, name, display_name, description")
        .eq("id", playId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!playId,
  });

  if (!config || !module) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Unknown module</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (error || !play) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-destructive">Failed to load play</p>
        <Button variant="outline" onClick={() => navigate(`/${module}/new`)}>
          Go back
        </Button>
      </div>
    );
  }

  const playName = play.display_name || play.name;

  return (
    <WorkstreamWizardProvider playId={play.id} playName={playName} module={module}>
      <WizardContent module={module} playName={playName} />
    </WorkstreamWizardProvider>
  );
}
