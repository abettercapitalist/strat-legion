import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";

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
  // Non-sales modules skip step 4, so they have 4 effective steps
  const totalSteps = isSalesModule ? BASE_TOTAL_STEPS : BASE_TOTAL_STEPS - 1;

  const setCounterparty = (id: string, name: string) => {
    setState((prev) => ({ ...prev, counterparty_id: id, counterparty_name: name }));
  };

  const setBusinessObjective = (objective: string) => {
    setState((prev) => ({ ...prev, business_objective: objective }));
  };

  const setOptionalSteps = (steps: string[]) => {
    setState((prev) => ({ ...prev, optional_steps: steps }));
  };

  const setCommercialTerms = (terms: Record<string, unknown> | null) => {
    setState((prev) => ({ ...prev, commercial_terms: terms }));
  };

  const nextStep = () => {
    setState((prev) => {
      let nextStepNum = prev.current_step + 1;
      
      // Skip step 4 for non-sales modules
      if (!isSalesModule && nextStepNum === 4) {
        nextStepNum = 5;
      }
      
      return {
        ...prev,
        current_step: Math.min(nextStepNum, BASE_TOTAL_STEPS),
      };
    });
  };

  const prevStep = () => {
    setState((prev) => {
      let prevStepNum = prev.current_step - 1;
      
      // Skip step 4 for non-sales modules
      if (!isSalesModule && prevStepNum === 4) {
        prevStepNum = 3;
      }
      
      return {
        ...prev,
        current_step: Math.max(prevStepNum, 1),
      };
    });
  };

  const goToStep = (step: number) => {
    // For non-sales, don't allow going to step 4
    if (!isSalesModule && step === 4) return;
    
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

  // Convert actual step number to display step number (1-indexed for display)
  const getDisplayStep = (actualStep: number): number => {
    if (!isSalesModule && actualStep >= 5) {
      return actualStep - 1; // Step 5 becomes display step 4
    }
    return actualStep;
  };

  // Convert display step to actual step
  const getActualStep = (displayStep: number): number => {
    if (!isSalesModule && displayStep >= 4) {
      return displayStep + 1; // Display step 4 is actual step 5
    }
    return displayStep;
  };

  const value = useMemo(() => ({
    state,
    module,
    isSalesModule,
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
  }), [state, module, isSalesModule, totalSteps]);

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
