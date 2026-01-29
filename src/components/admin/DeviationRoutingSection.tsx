import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "@/types/autoApproval";
import { useRoles } from "@/hooks/useRoles";

export interface CustomDeviationRule {
  id: string;
  name: string;
  approver_role: string;
}

interface DeviationRoutingSectionProps {
  routing: Partial<Record<DeviationType, DeviationRoute>>;
  onRoutingChange: (routing: Partial<Record<DeviationType, DeviationRoute>>) => void;
  customRules?: CustomDeviationRule[];
  onCustomRulesChange?: (rules: CustomDeviationRule[]) => void;
}

export function DeviationRoutingSection({
  routing,
  onRoutingChange,
  customRules = [],
  onCustomRulesChange,
}: DeviationRoutingSectionProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const { roles, isLoading } = useRoles({ workRoutingOnly: true });
  
  // Dynamic roles from roles table
  const approverRoleOptions = roles.map(r => ({
    value: r.id,
    label: r.display_name || r.name,
  }));

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

  const handleAddCustomRule = () => {
    if (!newRuleName.trim() || !onCustomRulesChange) return;
    
    const newRule: CustomDeviationRule = {
      id: `custom_${Date.now()}`,
      name: newRuleName.trim(),
      approver_role: "",
    };
    
    onCustomRulesChange([...customRules, newRule]);
    setNewRuleName("");
    setIsAddingCustom(false);
  };

  const handleUpdateCustomRule = (id: string, approverRole: string) => {
    if (!onCustomRulesChange) return;
    onCustomRulesChange(
      customRules.map((rule) =>
        rule.id === id ? { ...rule, approver_role: approverRole } : rule
      )
    );
  };

  const handleRemoveCustomRule = (id: string) => {
    if (!onCustomRulesChange) return;
    onCustomRulesChange(customRules.filter((rule) => rule.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-1">Deviation Routing</h4>
        <p className="text-xs text-muted-foreground mb-4">
          When terms deviate from standards, route to:
        </p>
      </div>

      {/* Standard deviation types */}
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
                {approverRoleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Custom deviation rules */}
      {customRules.length > 0 && (
        <div className="grid gap-3 pt-2">
          {customRules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3">
              <Label className="text-sm w-36 shrink-0 truncate" title={rule.name}>
                {rule.name} →
              </Label>
              <Select
                value={rule.approver_role || ''}
                onValueChange={(value) => handleUpdateCustomRule(rule.id, value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {approverRoleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveCustomRule(rule.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add custom rule */}
      {isAddingCustom ? (
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newRuleName}
            onChange={(e) => setNewRuleName(e.target.value)}
            placeholder="Custom rule name..."
            className="w-36"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomRule();
              } else if (e.key === "Escape") {
                setIsAddingCustom(false);
                setNewRuleName("");
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustomRule}
            disabled={!newRuleName.trim()}
          >
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAddingCustom(false);
              setNewRuleName("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setIsAddingCustom(true)}
        >
          <Plus className="h-3 w-3" />
          Add custom deviation rule
        </Button>
      )}
    </div>
  );
}
