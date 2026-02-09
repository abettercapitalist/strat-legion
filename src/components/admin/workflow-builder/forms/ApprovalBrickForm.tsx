import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MultiTeamCombobox } from '@/components/admin/MultiTeamCombobox';
import { InlineAutoApprovalSection } from '@/components/admin/InlineAutoApprovalSection';
import { APPROVER_ROLE_OPTIONS } from '@/types/autoApproval';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface ApprovalBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export function ApprovalBrickForm({ config, onConfigChange }: ApprovalBrickFormProps) {
  const approverTeams = (config.approver_teams as string[]) || [];
  const approvalMode = (config.approval_mode as string) || 'any';
  const escalationOpen = Boolean(config.escalation_role);

  return (
    <div className="space-y-4">
      {/* Approver Teams */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Approver Teams</Label>
        <p className="text-xs text-muted-foreground">
          Teams whose members can approve this step
        </p>
        <MultiTeamCombobox
          value={approverTeams}
          onValueChange={(teams) => onConfigChange({ approver_teams: teams })}
          placeholder="Select approver teams..."
          excludeCounterparty={true}
        />
      </div>

      {/* Approval Mode */}
      {approverTeams.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Approval Mode</Label>
          <p className="text-xs text-muted-foreground">How should multiple approvers participate?</p>
          <RadioGroup
            value={approvalMode}
            onValueChange={(value) => onConfigChange({ approval_mode: value })}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="approval-mode-any" />
              <Label htmlFor="approval-mode-any" className="text-sm font-normal cursor-pointer">
                Any one approver (first to respond)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="approval-mode-all" />
              <Label htmlFor="approval-mode-all" className="text-sm font-normal cursor-pointer">
                All approvers must approve
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="majority" id="approval-mode-majority" />
              <Label htmlFor="approval-mode-majority" className="text-sm font-normal cursor-pointer">
                Majority must approve
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* SLA Hours */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">SLA (hours)</Label>
        <Input
          type="number"
          placeholder="e.g., 24"
          value={(config.sla_hours as string) || ''}
          onChange={(e) => onConfigChange({ sla_hours: e.target.value })}
          className="w-32"
        />
      </div>

      {/* Auto-Approval Standards */}
      <InlineAutoApprovalSection
        config={{
          auto_approval_standards: config.auto_approval_standards as any,
          custom_standards: config.custom_standards as any,
        }}
        onConfigChange={(autoConfig) => {
          onConfigChange({
            auto_approval_standards: autoConfig.auto_approval_standards,
            custom_standards: autoConfig.custom_standards,
          });
        }}
      />

      {/* Escalation Override */}
      <Collapsible
        open={escalationOpen}
        onOpenChange={(open) => {
          if (!open) onConfigChange({ escalation_role: undefined });
        }}
        className="border-t pt-4"
      >
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Escalation Override</span>
              {config.escalation_role && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Configured</span>
              )}
            </div>
            {escalationOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 pl-6 space-y-3">
          <p className="text-xs text-muted-foreground italic">
            Optionally escalate certain cases to a specialist when manual review is needed.
          </p>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Escalate to</Label>
            <Select
              value={(config.escalation_role as string) || ''}
              onValueChange={(value) => onConfigChange({ escalation_role: value || undefined })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No escalation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No escalation</SelectItem>
                {APPROVER_ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
