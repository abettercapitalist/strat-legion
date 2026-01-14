import { useState } from "react";
import { Settings, ChevronDown, ChevronRight, Plus } from "lucide-react";
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
import { DeviationRoutingSection } from "./DeviationRoutingSection";
import {
  AutoApprovalConfig,
  CounterpartyTier,
  TierStandards,
  DeviationRoute,
  DeviationType,
  TIER_LABELS,
  DEFAULT_TIER_STANDARDS,
} from "@/types/autoApproval";

interface AutoApprovalSectionProps {
  config: AutoApprovalConfig | null;
  onConfigChange: (config: AutoApprovalConfig | null) => void;
  isEditing: boolean;
}

const AVAILABLE_TIERS: CounterpartyTier[] = ['enterprise', 'mid_market', 'smb'];

export function AutoApprovalSection({
  config,
  onConfigChange,
  isEditing,
}: AutoApprovalSectionProps) {
  const [isOpen, setIsOpen] = useState(!isEditing);
  const [expandedTiers, setExpandedTiers] = useState<string[]>(['enterprise']);

  // Initialize with default config if not set
  const currentConfig: AutoApprovalConfig = config || {
    auto_approval_standards: {},
    deviation_routing: {},
  };

  const configuredTiers = Object.keys(
    currentConfig.auto_approval_standards
  ) as CounterpartyTier[];
  
  const availableTiersToAdd = AVAILABLE_TIERS.filter(
    (tier) => !configuredTiers.includes(tier)
  );

  const handleAddTier = (tier: CounterpartyTier) => {
    const newConfig: AutoApprovalConfig = {
      ...currentConfig,
      auto_approval_standards: {
        ...currentConfig.auto_approval_standards,
        [tier]: { ...DEFAULT_TIER_STANDARDS },
      },
    };
    onConfigChange(newConfig);
    setExpandedTiers([...expandedTiers, tier]);
  };

  const handleRemoveTier = (tier: CounterpartyTier) => {
    const { [tier]: _, ...rest } = currentConfig.auto_approval_standards;
    const newConfig: AutoApprovalConfig = {
      ...currentConfig,
      auto_approval_standards: rest,
    };
    
    // If no tiers left, set config to null
    if (Object.keys(rest).length === 0) {
      onConfigChange(null);
    } else {
      onConfigChange(newConfig);
    }
  };

  const handleUpdateTier = (tier: CounterpartyTier, standards: TierStandards) => {
    const newConfig: AutoApprovalConfig = {
      ...currentConfig,
      auto_approval_standards: {
        ...currentConfig.auto_approval_standards,
        [tier]: standards,
      },
    };
    onConfigChange(newConfig);
  };

  const handleRoutingChange = (
    routing: Partial<Record<DeviationType, DeviationRoute>>
  ) => {
    const newConfig: AutoApprovalConfig = {
      ...currentConfig,
      deviation_routing: routing,
    };
    onConfigChange(newConfig);
  };

  const hasTiers = configuredTiers.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between px-0 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-medium">
              Auto-Approval Standards (Optional)
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define acceptable ranges for deal terms. Deals within these
            boundaries will auto-approve without manual review.
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
                      standards={
                        currentConfig.auto_approval_standards[tier]!
                      }
                      onUpdate={(standards) => handleUpdateTier(tier, standards)}
                      onRemove={() => handleRemoveTier(tier)}
                      canRemove={configuredTiers.length > 1}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Add Tier Button */}
          {availableTiersToAdd.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {!hasTiers && (
                <p className="w-full text-sm text-muted-foreground mb-2">
                  Click a tier below to configure auto-approval standards:
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

          {/* Deviation Routing Section */}
          {hasTiers && (
            <DeviationRoutingSection
              routing={currentConfig.deviation_routing}
              onRoutingChange={handleRoutingChange}
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
