import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRoles } from "@/hooks/useRoles";

export interface PlayApprovalConfig {
  required_roles: string[];
  approval_mode: "all" | "any";
  auto_approve_if_creator_role?: string;
}

interface PlayApprovalSectionProps {
  config: PlayApprovalConfig;
  onChange: (config: PlayApprovalConfig) => void;
}

export function PlayApprovalSection({ config, onChange }: PlayApprovalSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { roles, isLoading } = useRoles({ workRoutingOnly: true });
  
  // Dynamic roles from custom_roles table
  const approverRoles = roles.map(r => ({
    value: r.id,
    label: r.display_name || r.name,
  }));

  const handleRoleToggle = (role: string, checked: boolean) => {
    const current = config.required_roles || [];
    const updated = checked
      ? [...current, role]
      : current.filter((r) => r !== role);
    onChange({ ...config, required_roles: updated });
  };

  const handleModeChange = (mode: "all" | "any") => {
    onChange({ ...config, approval_mode: mode });
  };

  const handleAutoApproveRoleChange = (role: string) => {
    onChange({
      ...config,
      auto_approve_if_creator_role: role === "none" ? undefined : role,
    });
  };

  const selectedRolesCount = config.required_roles?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Activation Approval
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select which roles must approve before this Play can be activated
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Selection */}
        <div className="grid gap-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles...</p>
          ) : approverRoles.map((role) => (
            <label
              key={role.value}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={(config.required_roles || []).includes(role.value)}
                onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
              />
              <span className="text-sm">{role.label}</span>
            </label>
          ))}
        </div>

        {/* Approval Mode - only show if multiple roles selected */}
        {selectedRolesCount > 1 && (
          <div className="pt-2 border-t space-y-2">
            <Label className="text-sm">Approval Mode</Label>
            <RadioGroup
              value={config.approval_mode || "all"}
              onValueChange={(v) => handleModeChange(v as "all" | "any")}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <RadioGroupItem value="all" />
                <span>All must approve</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <RadioGroupItem value="any" />
                <span>Any one can approve</span>
              </label>
            </RadioGroup>
          </div>
        )}

        {/* Advanced Options - Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Advanced
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <Label className="text-sm">Auto-approve Bypass</Label>
              <p className="text-xs text-muted-foreground">
                Skip approval if the Play creator has this role
              </p>
              <Select
                value={config.auto_approve_if_creator_role || "none"}
                onValueChange={handleAutoApproveRoleChange}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="No bypass" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No bypass</SelectItem>
                  {approverRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Summary */}
        {selectedRolesCount === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No approval required — Play will activate immediately
          </p>
        )}
      </CardContent>
    </Card>
  );
}
