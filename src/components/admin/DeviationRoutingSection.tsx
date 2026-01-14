import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DeviationType,
  DeviationRoute,
  DEVIATION_LABELS,
  APPROVER_ROLE_OPTIONS,
} from "@/types/autoApproval";

interface DeviationRoutingSectionProps {
  routing: Partial<Record<DeviationType, DeviationRoute>>;
  onRoutingChange: (routing: Partial<Record<DeviationType, DeviationRoute>>) => void;
}

export function DeviationRoutingSection({
  routing,
  onRoutingChange,
}: DeviationRoutingSectionProps) {
  const deviationTypes: DeviationType[] = [
    'payment_terms',
    'liability_cap',
    'discount',
    'contract_duration',
  ];

  const handleRouteChange = (type: DeviationType, approverRole: string) => {
    onRoutingChange({
      ...routing,
      [type]: { approver_role: approverRole },
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-1">Deviation Routing</h4>
        <p className="text-xs text-muted-foreground mb-4">
          When terms deviate from standards, route to:
        </p>
      </div>

      <div className="grid gap-3">
        {deviationTypes.map((type) => (
          <div key={type} className="flex items-center gap-3">
            <Label className="text-sm w-36 shrink-0">
              {DEVIATION_LABELS[type]} →
            </Label>
            <Select
              value={routing[type]?.approver_role || ''}
              onValueChange={(value) => handleRouteChange(type, value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {APPROVER_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
