import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TierConfigCard } from "./TierConfigCard";
import { CustomStandardsSection } from "./CustomStandardsSection";
import {
  CounterpartyTier,
  TierStandards,
  CustomStandard,
  TIER_LABELS,
  DEFAULT_TIER_STANDARDS,
} from "@/types/autoApproval";

interface AutoApprovalStepConfig {
  auto_approval_standards?: Partial<Record<CounterpartyTier, TierStandards>>;
  custom_standards?: CustomStandard[];
}

interface InlineAutoApprovalSectionProps {
  config: AutoApprovalStepConfig;
  onConfigChange: (config: AutoApprovalStepConfig) => void;
}

const AVAILABLE_TIERS: CounterpartyTier[] = ["enterprise", "mid_market", "smb"];

export function InlineAutoApprovalSection({
  config,
  onConfigChange,
}: InlineAutoApprovalSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<string[]>([]);

  const currentStandards = config.auto_approval_standards || {};
  const customStandards = config.custom_standards || [];

  const configuredTiers = Object.keys(currentStandards) as CounterpartyTier[];
  const availableTiersToAdd = AVAILABLE_TIERS.filter(
    (tier) => !configuredTiers.includes(tier)
  );

  const handleAddTier = (tier: CounterpartyTier) => {
    const newStandards = {
      ...currentStandards,
      [tier]: { ...DEFAULT_TIER_STANDARDS },
    };
    onConfigChange({
      ...config,
      auto_approval_standards: newStandards,
    });
    setExpandedTiers([...expandedTiers, tier]);
  };

  const handleRemoveTier = (tier: CounterpartyTier) => {
    const { [tier]: _, ...rest } = currentStandards;
    onConfigChange({
      ...config,
      auto_approval_standards: Object.keys(rest).length > 0 ? rest : undefined,
    });
  };

  const handleUpdateTier = (tier: CounterpartyTier, standards: TierStandards) => {
    onConfigChange({
      ...config,
      auto_approval_standards: {
        ...currentStandards,
        [tier]: standards,
      },
    });
  };

  const handleCustomStandardsChange = (standards: CustomStandard[]) => {
    onConfigChange({
      ...config,
      custom_standards: standards.length > 0 ? standards : undefined,
    });
  };

  const hasTiers = configuredTiers.length > 0;
  const hasCustomStandards = customStandards.length > 0;
  const hasAnyConfig = hasTiers || hasCustomStandards;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t pt-4">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between px-0 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              Auto-Approval Standards
            </span>
            {hasAnyConfig && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Configured
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="space-y-4 pl-6">
          <p className="text-xs text-muted-foreground italic">
            Optional: When a deal meets these standards, approval is granted
            automatically. The approvers above can view all auto-approved items
            in their dashboard.
          </p>

          {/* Tier Configuration Accordion */}
          {hasTiers && (
            <Accordion
              type="multiple"
              value={expandedTiers}
              onValueChange={setExpandedTiers}
              className="space-y-3"
            >
              {configuredTiers.map((tier) => (
                <AccordionItem key={tier} value={tier} className="border-none">
                  <AccordionTrigger className="px-4 py-3 bg-muted/50 rounded-lg hover:no-underline hover:bg-muted/70">
                    <span className="text-sm font-medium">
                      {TIER_LABELS[tier]} Tier
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 pb-0">
                    <TierConfigCard
                      tier={tier}
                      standards={currentStandards[tier]!}
                      onUpdate={(standards) => handleUpdateTier(tier, standards)}
                      onRemove={() => handleRemoveTier(tier)}
                      canRemove={true}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Add Tier Buttons */}
          {availableTiersToAdd.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {!hasTiers && (
                <p className="w-full text-xs text-muted-foreground mb-2">
                  Add tier-based standards:
                </p>
              )}
              {availableTiersToAdd.map((tier) => (
                <Button
                  key={tier}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTier(tier)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {hasTiers ? `Add ${TIER_LABELS[tier]}` : TIER_LABELS[tier]}
                </Button>
              ))}
            </div>
          )}

          {/* Custom Standards Section */}
          <CustomStandardsSection
            standards={customStandards}
            onStandardsChange={handleCustomStandardsChange}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
