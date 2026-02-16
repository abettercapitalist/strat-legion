import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, X } from 'lucide-react';
import { RoleCombobox } from '@/components/admin/RoleCombobox';
import { UserCombobox } from './UserCombobox';
import type { ReviewCriterion } from '@/lib/bricks/types';
import type { UpstreamOutput } from '../outputSchemas';

interface ReviewBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  availableDocuments?: UpstreamOutput[];
}

export function ReviewBrickForm({ config, onConfigChange, availableDocuments = [] }: ReviewBrickFormProps) {
  const reviewType = (config.review_type as string) || 'checklist';
  const criteria = (config.criteria as ReviewCriterion[]) || [];
  const documentId = (config.document_id as string) || '';

  const updateCriterion = (index: number, updates: Partial<ReviewCriterion>) => {
    const newCriteria = criteria.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onConfigChange({ criteria: newCriteria });
  };

  const addCriterion = () => {
    const newCriterion: ReviewCriterion = {
      id: crypto.randomUUID(),
      label: '',
      required: true,
    };
    onConfigChange({ criteria: [...criteria, newCriterion] });
  };

  const removeCriterion = (index: number) => {
    onConfigChange({ criteria: criteria.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {availableDocuments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Document</Label>
          <Select
            value={documentId}
            onValueChange={(value) => onConfigChange({ document_id: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document (optional)" />
            </SelectTrigger>
            <SelectContent>
              {availableDocuments.map((doc) => (
                <SelectItem key={doc.nodeId} value={doc.nodeId}>
                  {doc.nodeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Review Type</Label>
        <RadioGroup
          value={reviewType}
          onValueChange={(value) => onConfigChange({ review_type: value })}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="checklist" id="review-checklist" />
            <Label htmlFor="review-checklist" className="text-sm font-normal cursor-pointer">Checklist</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scored" id="review-scored" />
            <Label htmlFor="review-scored" className="text-sm font-normal cursor-pointer">Scored</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="qualitative" id="review-qualitative" />
            <Label htmlFor="review-qualitative" className="text-sm font-normal cursor-pointer">Qualitative</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Reviewer</Label>
        <Select
          value={((config.reviewer_assignment as Record<string, unknown>)?.type as string) || ''}
          onValueChange={(value) => onConfigChange({ reviewer_assignment: { type: value } })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select reviewer type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="workstream_owner">Play Owner</SelectItem>
            <SelectItem value="role">Specific Role</SelectItem>
            <SelectItem value="user">Specific User</SelectItem>
          </SelectContent>
        </Select>
        {((config.reviewer_assignment as Record<string, unknown>)?.type as string) === 'role' && (
          <RoleCombobox
            value={((config.reviewer_assignment as Record<string, unknown>)?.role_id as string) || undefined}
            onValueChange={(roleId) =>
              onConfigChange({ reviewer_assignment: { type: 'role', role_id: roleId } })
            }
            placeholder="Select role..."
          />
        )}
        {((config.reviewer_assignment as Record<string, unknown>)?.type as string) === 'user' && (
          <UserCombobox
            value={((config.reviewer_assignment as Record<string, unknown>)?.user_id as string) || undefined}
            onValueChange={(userId, roleId) =>
              onConfigChange({ reviewer_assignment: { type: 'user', user_id: userId, role_id: roleId } })
            }
            placeholder="Select user..."
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">SLA (hours)</Label>
        <Input
          type="number"
          placeholder="e.g., 48"
          value={(config.sla?.deadline_hours as number) || ''}
          onChange={(e) =>
            onConfigChange({ sla: { ...((config.sla as Record<string, unknown>) || {}), deadline_hours: e.target.value ? Number(e.target.value) : undefined } })
          }
          className="w-32"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Review Criteria</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" />
            Add Criterion
          </Button>
        </div>
        {criteria.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No criteria defined. Add criteria for the review.</p>
        )}
        {criteria.map((criterion, index) => (
          <div key={criterion.id} className="flex items-center gap-2">
            <Input
              placeholder="Criterion label"
              value={criterion.label}
              onChange={(e) => updateCriterion(index, { label: e.target.value })}
              className="flex-1 h-8 text-sm"
            />
            {reviewType === 'scored' && (
              <Input
                type="number"
                placeholder="Weight"
                value={criterion.weight || ''}
                onChange={(e) => updateCriterion(index, { weight: e.target.value ? Number(e.target.value) : undefined })}
                className="w-20 h-8 text-sm"
              />
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => removeCriterion(index)} className="h-8 w-8 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
