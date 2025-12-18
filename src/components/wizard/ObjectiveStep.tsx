import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb } from "lucide-react";
import { useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";

interface ObjectiveStepProps {
  module: string;
  displayName: string;
}

const moduleExamples: Record<string, string[]> = {
  sales: [
    "Close Q4 enterprise expansion with Acme",
    "Upsell premium tier to existing customer",
    "Land new logo in healthcare vertical",
  ],
  law: [
    "Onboard cloud infrastructure vendor",
    "Annual compliance filing for 2025",
    "Negotiate strategic partnership agreement",
  ],
  finance: [
    "Complete annual audit preparation",
    "Restructure vendor payment terms",
    "Implement new billing system integration",
  ],
};

const MAX_CHARS = 500;

export function ObjectiveStep({ module, displayName }: ObjectiveStepProps) {
  const { state, setBusinessObjective } = useWorkstreamWizard();
  const [objective, setObjective] = useState(state.business_objective);

  const examples = moduleExamples[module] || moduleExamples.sales;
  const charCount = objective.length;

  useEffect(() => {
    setObjective(state.business_objective);
  }, [state.business_objective]);

  // Update wizard state on change so parent can check validity
  useEffect(() => {
    setBusinessObjective(objective);
  }, [objective, setBusinessObjective]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setObjective(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Describe the purpose of this {displayName.toLowerCase()}.
          This helps your team understand why this work matters.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="objective" className="text-base font-medium">
          Business Objective <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="objective"
          value={objective}
          onChange={handleChange}
          placeholder={`What's the goal of this ${displayName.toLowerCase()}?`}
          className="min-h-[80px] max-h-[240px] resize-y"
          rows={3}
        />
        <div className="flex justify-end">
          <span className={`text-sm ${charCount > MAX_CHARS * 0.9 ? 'text-warning' : 'text-muted-foreground'}`}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          Examples
        </div>
        <ul className="space-y-2">
          {examples.map((example, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>"{example}"</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
