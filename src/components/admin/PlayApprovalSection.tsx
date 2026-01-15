import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Info } from "lucide-react";

interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PlayApprovalConfig {
  required_approvers: string[];
  approval_mode: "all" | "any";
  instructions?: string;
  auto_approve_if_creator_role?: string;
}

interface PlayApprovalSectionProps {
  config: PlayApprovalConfig;
  onChange: (config: PlayApprovalConfig) => void;
}

const ROLE_LABELS: Record<string, string> = {
  general_counsel: "General Counsel",
  legal_ops: "Legal Ops",
  contract_counsel: "Contract Counsel",
  account_executive: "Account Executive",
  sales_manager: "Sales Manager",
  finance_reviewer: "Finance Reviewer",
};

export function PlayApprovalSection({ config, onChange }: PlayApprovalSectionProps) {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApprovers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email
          `)
          .order("full_name");

        if (error) throw error;

        // Also fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role");

        if (rolesError) throw rolesError;

        // Map roles to users
        const roleMap = new Map<string, string>();
        rolesData?.forEach((r) => {
          roleMap.set(r.user_id, r.role);
        });

        const mapped: Approver[] = (data || [])
          .filter((p) => roleMap.has(p.id))
          .map((p) => ({
            id: p.id,
            name: p.full_name || p.email || "Unknown",
            email: p.email || "",
            role: roleMap.get(p.id) || "",
          }));

        setApprovers(mapped);
      } catch (err) {
        console.error("Error fetching approvers:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchApprovers();
  }, []);

  const handleApproverToggle = (approverId: string) => {
    const current = config.required_approvers || [];
    const updated = current.includes(approverId)
      ? current.filter((id) => id !== approverId)
      : [...current, approverId];
    onChange({ ...config, required_approvers: updated });
  };

  const handleModeChange = (mode: "all" | "any") => {
    onChange({ ...config, approval_mode: mode });
  };

  const handleInstructionsChange = (instructions: string) => {
    onChange({ ...config, instructions });
  };

  const handleAutoApproveRoleChange = (role: string) => {
    onChange({
      ...config,
      auto_approve_if_creator_role: role === "none" ? undefined : role,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Play Activation Approval
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define who must approve this Play before it can be activated for use
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Approvers */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Required Approvers
          </Label>
          <p className="text-sm text-muted-foreground">
            Select who must approve before this Play can be activated
          </p>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading approvers...</div>
          ) : approvers.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No users with approval roles found
            </div>
          ) : (
            <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {approvers.map((approver) => (
                <label
                  key={approver.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={(config.required_approvers || []).includes(approver.id)}
                    onCheckedChange={() => handleApproverToggle(approver.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{approver.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {ROLE_LABELS[approver.role] || approver.role}
                      {approver.email && ` • ${approver.email}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Approval Mode */}
        {(config.required_approvers?.length || 0) > 1 && (
          <div className="space-y-3">
            <Label>Approval Mode</Label>
            <RadioGroup
              value={config.approval_mode || "all"}
              onValueChange={(v) => handleModeChange(v as "all" | "any")}
              className="flex gap-6"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="all" />
                <span>All must approve</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="any" />
                <span>Any one can approve</span>
              </label>
            </RadioGroup>
          </div>
        )}

        {/* Approval Instructions */}
        <div className="space-y-2">
          <Label htmlFor="approval-instructions">Approval Instructions (optional)</Label>
          <Textarea
            id="approval-instructions"
            placeholder="Provide context or specific criteria for approvers to evaluate..."
            value={config.instructions || ""}
            onChange={(e) => handleInstructionsChange(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Auto-approve bypass */}
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <Label className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Auto-approve Bypass (optional)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
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
              <SelectItem value="none">No bypass - always require approval</SelectItem>
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <SelectItem key={role} value={role}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
