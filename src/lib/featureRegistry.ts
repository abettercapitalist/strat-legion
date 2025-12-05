/**
 * Feature Registry Schema
 * 
 * TODO: Expand with validation logic and debug UI when ready to build workflow customization.
 * This defines workflow components with their inputs (anti-studs) and outputs (studs).
 */

export interface FeatureComponent {
  id: string;
  name: string;
  description: string;
  inputs: string[];   // What this component needs (anti-studs)
  outputs: string[];  // What this component produces (studs)
  availableTo: string[];  // Role IDs that can see this feature
  defaultEnabledFor: string[];  // Roles that have it enabled by default
}

export const featureRegistry: FeatureComponent[] = [
  {
    id: "deal-creation",
    name: "Deal Creation",
    description: "Create a new deal with business objectives",
    inputs: [],  // Entry point, no inputs needed
    outputs: ["draft-deal"],
    availableTo: ["sales", "manager"],
    defaultEnabledFor: ["sales"],
  },
  {
    id: "template-selection",
    name: "Template Selection",
    description: "Select contract template based on deal type",
    inputs: ["draft-deal"],
    outputs: ["deal-with-template"],
    availableTo: ["sales", "manager", "law"],
    defaultEnabledFor: ["sales"],
  },
  {
    id: "manager-approval",
    name: "Manager Approval",
    description: "Sales manager reviews and approves deal terms",
    inputs: ["deal-with-template"],
    outputs: ["approved-deal"],
    availableTo: ["manager"],
    defaultEnabledFor: ["manager"],
  },
  {
    id: "legal-review",
    name: "Legal Review",
    description: "Legal team reviews non-standard terms",
    inputs: ["approved-deal", "deal-with-template"],  // Can receive from multiple sources
    outputs: ["legal-approved-deal"],
    availableTo: ["law", "legal-ops"],
    defaultEnabledFor: ["law"],
  },
  {
    id: "contract-generation",
    name: "Contract Generation",
    description: "Generate final contract document",
    inputs: ["approved-deal", "legal-approved-deal"],
    outputs: ["generated-contract"],
    availableTo: ["sales", "law", "legal-ops"],
    defaultEnabledFor: ["sales", "law"],
  },
  {
    id: "signature-collection",
    name: "Signature Collection",
    description: "Send contract for e-signature",
    inputs: ["generated-contract"],
    outputs: ["signed-contract"],
    availableTo: ["sales", "manager"],
    defaultEnabledFor: ["sales"],
  },
];

// Simple validation: check if output from one component can connect to input of another
export function canConnect(fromId: string, toId: string): boolean {
  const from = featureRegistry.find(f => f.id === fromId);
  const to = featureRegistry.find(f => f.id === toId);
  
  if (!from || !to) return false;
  
  return from.outputs.some(output => to.inputs.includes(output));
}
