import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import {
  CounterpartyTier,
  PaymentTerm,
  TierStandards,
  TIER_LABELS,
  PAYMENT_TERM_LABELS,
} from "@/types/autoApproval";

interface TierConfigCardProps {
  tier: CounterpartyTier;
  standards: TierStandards;
  onUpdate: (standards: TierStandards) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function TierConfigCard({
  tier,
  standards,
  onUpdate,
  onRemove,
  canRemove,
}: TierConfigCardProps) {
  const paymentTermOptions: PaymentTerm[] = ['net_30', 'net_60', 'net_90', 'net_120'];

  const handlePaymentTermToggle = (term: PaymentTerm, checked: boolean) => {
    const newTerms = checked
      ? [...standards.payment_terms, term]
      : standards.payment_terms.filter((t) => t !== term);
    onUpdate({ ...standards, payment_terms: newTerms });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {TIER_LABELS[tier]} Tier
          </CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Terms */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Payment Terms (select allowed options)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {paymentTermOptions.map((term) => (
              <div key={term} className="flex items-center space-x-2">
                <Checkbox
                  id={`${tier}-${term}`}
                  checked={standards.payment_terms.includes(term)}
                  onCheckedChange={(checked) =>
                    handlePaymentTermToggle(term, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`${tier}-${term}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {PAYMENT_TERM_LABELS[term]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Discount Percentage */}
        <div className="space-y-2">
          <Label htmlFor={`${tier}-discount`} className="text-sm font-medium">
            Discount Percentage
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Maximum:</span>
            <div className="relative w-24">
              <Input
                id={`${tier}-discount`}
                type="number"
                min={1}
                max={99}
                value={standards.discount_max}
                onChange={(e) =>
                  onUpdate({
                    ...standards,
                    discount_max: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="pr-6"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Liability Cap */}
        <div className="space-y-2">
          <Label htmlFor={`${tier}-liability`} className="text-sm font-medium">
            Liability Cap
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Minimum:</span>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id={`${tier}-liability`}
                type="text"
                value={formatCurrency(standards.liability_cap_min)}
                onChange={(e) =>
                  onUpdate({
                    ...standards,
                    liability_cap_min: parseCurrency(e.target.value),
                  })
                }
                className="pl-6"
              />
            </div>
          </div>
        </div>

        {/* Contract Duration */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contract Duration (years)</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Minimum:</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={standards.contract_duration_min}
                onChange={(e) =>
                  onUpdate({
                    ...standards,
                    contract_duration_min: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Maximum:</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={standards.contract_duration_max}
                onChange={(e) =>
                  onUpdate({
                    ...standards,
                    contract_duration_max: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-20"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
