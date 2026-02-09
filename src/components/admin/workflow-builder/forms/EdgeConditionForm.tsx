import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkflowEdgeData } from '../types';
import type { WorkflowEdgeType } from '@/lib/bricks/types';

interface EdgeConditionFormProps {
  edgeData: WorkflowEdgeData;
  onEdgeDataChange: (data: Partial<WorkflowEdgeData>) => void;
}

export function EdgeConditionForm({ edgeData, onEdgeDataChange }: EdgeConditionFormProps) {
  const condition = (edgeData.condition as Record<string, unknown>) || {};

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Edge Type</Label>
        <Select
          value={edgeData.edgeType}
          onValueChange={(value) => onEdgeDataChange({ edgeType: value as WorkflowEdgeType })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (always fire)</SelectItem>
            <SelectItem value="conditional">Conditional</SelectItem>
            <SelectItem value="error">Error (on failure)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Label</Label>
        <Input
          placeholder="e.g., Approved, Rejected"
          value={edgeData.label || ''}
          onChange={(e) => onEdgeDataChange({ label: e.target.value || null })}
        />
      </div>

      {edgeData.edgeType === 'conditional' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Condition Field</Label>
            <p className="text-xs text-muted-foreground">Field from the source brick's output to evaluate</p>
            <Input
              placeholder="e.g., decision"
              value={(condition.field as string) || ''}
              onChange={(e) =>
                onEdgeDataChange({ condition: { ...condition, field: e.target.value } })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Expected Value</Label>
            <p className="text-xs text-muted-foreground">Value that triggers this path</p>
            <Input
              placeholder="e.g., approved"
              value={(condition.value as string) || ''}
              onChange={(e) =>
                onEdgeDataChange({ condition: { ...condition, value: e.target.value } })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
