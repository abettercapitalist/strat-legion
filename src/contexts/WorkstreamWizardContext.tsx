import React, { createContext, useContext, useState, ReactNode } from "react";

export interface WizardState {
  play_id: string;
  play_name: string;
  counterparty_id: string | null;
  counterparty_name: string | null;
  business_objective: string;
  optional_steps: string[];
  commercial_terms: Record<string, unknown>;
  current_step: number;
}

interface WizardContextValue {
  state: WizardState;
  setCounterparty: (id: string, name: string) => void;
  setBusinessObjective: (objective: string) => void;
  setOptionalSteps: (steps: string[]) => void;
  setCommercialTerms: (terms: Record<string, unknown>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
  canProceed: (step: number) => boolean;
}

const TOTAL_STEPS = 5;

const defaultState: WizardState = {
  play_id: "",
  play_name: "",
  counterparty_id: null,
  counterparty_name: null,
  business_objective: "",
  optional_steps: [],
  commercial_terms: {},
  current_step: 1,
};

const WorkstreamWizardContext = createContext<WizardContextValue | null>(null);

export function WorkstreamWizardProvider({
  children,
  playId,
  playName,
}: {
  children: ReactNode;
  playId: string;
  playName: string;
}) {
  const [state, setState] = useState<WizardState>({
    ...defaultState,
    play_id: playId,
    play_name: playName,
  });

  const setCounterparty = (id: string, name: string) => {
    setState((prev) => ({ ...prev, counterparty_id: id, counterparty_name: name }));
  };

  const setBusinessObjective = (objective: string) => {
    setState((prev) => ({ ...prev, business_objective: objective }));
  };

  const setOptionalSteps = (steps: string[]) => {
    setState((prev) => ({ ...prev, optional_steps: steps }));
  };

  const setCommercialTerms = (terms: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, commercial_terms: terms }));
  };

  const nextStep = () => {
    setState((prev) => ({
      ...prev,
      current_step: Math.min(prev.current_step + 1, TOTAL_STEPS),
    }));
  };

  const prevStep = () => {
    setState((prev) => ({
      ...prev,
      current_step: Math.max(prev.current_step - 1, 1),
    }));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
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
        return !!state.business_objective.trim();
      case 3:
        return true; // Optional steps are optional
      case 4:
        return true; // Terms can be empty initially
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <WorkstreamWizardContext.Provider
      value={{
        state,
        setCounterparty,
        setBusinessObjective,
        setOptionalSteps,
        setCommercialTerms,
        nextStep,
        prevStep,
        goToStep,
        resetWizard,
        canProceed,
      }}
    >
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
