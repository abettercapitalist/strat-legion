import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WizardState {
  play_id: string;
  play_name: string;
  counterparty_id: string | null;
  counterparty_name: string | null;
  business_objective: string;
  optional_steps: string[];
  commercial_terms: Record<string, unknown> | null;
  current_step: number;
}

interface WizardContextValue {
  state: WizardState;
  module: string;
  isSalesModule: boolean;
  hasOptionalSteps: boolean;
  totalSteps: number;
  setCounterparty: (id: string, name: string) => void;
  setBusinessObjective: (objective: string) => void;
  setOptionalSteps: (steps: string[]) => void;
  setCommercialTerms: (terms: Record<string, unknown> | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
  canProceed: (step: number) => boolean;
  getDisplayStep: (actualStep: number) => number;
  getActualStep: (displayStep: number) => number;
}

const BASE_TOTAL_STEPS = 5;

const defaultState: WizardState = {
  play_id: "",
  play_name: "",
  counterparty_id: null,
  counterparty_name: null,
  business_objective: "",
  optional_steps: [],
  commercial_terms: null,
  current_step: 1,
};

const WorkstreamWizardContext = createContext<WizardContextValue | null>(null);

export function WorkstreamWizardProvider({
  children,
  playId,
  playName,
  module,
}: {
  children: ReactNode;
  playId: string;
  playName: string;
  module: string;
}) {
  const [state, setState] = useState<WizardState>({
    ...defaultState,
    play_id: playId,
    play_name: playName,
  });

  const isSalesModule = module === "sales";
  const [hasOptionalSteps, setHasOptionalSteps] = useState(true); // default true until loaded

  // Check if the play has optional steps
  useEffect(() => {
    const checkOptionalSteps = async () => {
      try {
        const { data } = await supabase
          .from("workstream_types")
          .select("default_workflow")
          .eq("id", playId)
          .single();

        if (data?.default_workflow) {
          try {
            const parsed = JSON.parse(data.default_workflow);
            const steps = Array.isArray(parsed) ? parsed : parsed.steps || [];
            const optional = steps.filter(
              (s: { requirement_type?: string }) =>
                s.requirement_type === "optional" || s.requirement_type === "required_deferred"
            );
            setHasOptionalSteps(optional.length > 0);
          } catch {
            setHasOptionalSteps(false);
          }
        } else {
          setHasOptionalSteps(false);
        }
      } catch {
        setHasOptionalSteps(false);
      }
    };
    checkOptionalSteps();
  }, [playId]);

  // Steps to skip
  const skipStep3 = !hasOptionalSteps;
  const skipStep4 = !isSalesModule;

  let totalSteps = BASE_TOTAL_STEPS;
  if (skipStep3) totalSteps--;
  if (skipStep4) totalSteps--;

  const setCounterparty = (id: string, name: string) => {
    setState((prev) => ({ ...prev, counterparty_id: id, counterparty_name: name }));
  };

  const setBusinessObjective = useCallback((objective: string) => {
    setState((prev) => {
      if (prev.business_objective === objective) return prev;
      return { ...prev, business_objective: objective };
    });
  }, []);

  const setOptionalSteps = (steps: string[]) => {
    setState((prev) => ({ ...prev, optional_steps: steps }));
  };

  const setCommercialTerms = (terms: Record<string, unknown> | null) => {
    setState((prev) => ({ ...prev, commercial_terms: terms }));
  };

  const shouldSkip = (step: number) =>
    (skipStep3 && step === 3) || (skipStep4 && step === 4);

  const nextStep = () => {
    setState((prev) => {
      let next = prev.current_step + 1;
      while (next <= BASE_TOTAL_STEPS && shouldSkip(next)) next++;
      return { ...prev, current_step: Math.min(next, BASE_TOTAL_STEPS) };
    });
  };

  const prevStep = () => {
    setState((prev) => {
      let prev_ = prev.current_step - 1;
      while (prev_ >= 1 && shouldSkip(prev_)) prev_--;
      return { ...prev, current_step: Math.max(prev_, 1) };
    });
  };

  const goToStep = (step: number) => {
    if (shouldSkip(step)) return;
    if (step >= 1 && step <= BASE_TOTAL_STEPS) {
      setState((prev) => ({ ...prev, current_step: step }));
    }
  };

  const resetWizard = () => {
    setState({
      ...defaultState,
      play_id: playId,
      play_name: playName,
    });
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!state.counterparty_id;
      case 2:
        return state.business_objective.trim().length >= 10;
      case 3:
        return true; // Optional steps are optional
      case 4:
        if (!isSalesModule) return true;
        // For sales, require ACV and payment terms
        const terms = state.commercial_terms as { 
          annual_contract_value?: number | null;
          payment_terms?: string;
        } | null;
        return !!(terms?.annual_contract_value && terms?.payment_terms);
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Build the ordered list of active (non-skipped) step IDs
  const activeStepIds = [1, 2, 3, 4, 5].filter((s) => !shouldSkip(s));

  // Convert actual step number to display step number (1-indexed for display)
  const getDisplayStep = (actualStep: number): number => {
    const idx = activeStepIds.indexOf(actualStep);
    return idx >= 0 ? idx + 1 : actualStep;
  };

  // Convert display step to actual step
  const getActualStep = (displayStep: number): number => {
    return activeStepIds[displayStep - 1] ?? displayStep;
  };

  const value = useMemo(() => ({
    state,
    module,
    isSalesModule,
    hasOptionalSteps,
    totalSteps,
    setCounterparty,
    setBusinessObjective,
    setOptionalSteps,
    setCommercialTerms,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    canProceed,
    getDisplayStep,
    getActualStep,
  }), [state, module, isSalesModule, hasOptionalSteps, totalSteps]);

  return (
    <WorkstreamWizardContext.Provider value={value}>
      {children}
    </WorkstreamWizardContext.Provider>
  );
}

export function useWorkstreamWizard() {
  const context = useContext(WorkstreamWizardContext);
  if (!context) {
    throw new Error("useWorkstreamWizard must be used within WorkstreamWizardProvider");
  }
  return context;
}
