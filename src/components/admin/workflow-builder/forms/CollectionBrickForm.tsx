import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { TeamCombobox } from '@/components/admin/TeamCombobox';
import type { CollectionField, CollectionFieldType } from '@/lib/bricks/types';

interface CollectionBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

const FIELD_TYPES: { value: CollectionFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
];

export function CollectionBrickForm({ config, onConfigChange }: CollectionBrickFormProps) {
  const fields = (config.fields as CollectionField[]) || [];
  const ownerType = (config.owner_assignment as Record<string, unknown>)?.type as string || '';

  const updateField = (index: number, updates: Partial<CollectionField>) => {
    const newFields = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onConfigChange({ fields: newFields });
  };

  const addField = () => {
    const newField: CollectionField = {
      name: `field_${fields.length + 1}`,
      label: '',
      field_type: 'text',
      required: false,
    };
    onConfigChange({ fields: [...fields, newField] });
  };

  const removeField = (index: number) => {
    onConfigChange({ fields: fields.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Owner</Label>
        <p className="text-xs text-muted-foreground">Who is responsible for collecting this information</p>
        <Select
          value={ownerType}
          onValueChange={(value) =>
            onConfigChange({ owner_assignment: { type: value } })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select owner type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="workstream_owner">Workstream Owner</SelectItem>
            <SelectItem value="role">Specific Role</SelectItem>
            <SelectItem value="user">Specific User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">SLA (hours)</Label>
        <Input
          type="number"
          placeholder="e.g., 24"
          value={(config.sla?.deadline_hours as number) || ''}
          onChange={(e) =>
            onConfigChange({ sla: { ...((config.sla as Record<string, unknown>) || {}), deadline_hours: e.target.value ? Number(e.target.value) : undefined } })
          }
          className="w-32"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Fields</Label>
          <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" />
            Add Field
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No fields defined. Add fields to collect information.</p>
        )}
        {fields.map((field, index) => (
          <div key={index} className="p-3 border rounded-md space-y-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Field label"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="flex-1 h-8 text-sm"
              />
              <Select
                value={field.field_type}
                onValueChange={(value) => updateField(index, { field_type: value as CollectionFieldType })}
              >
                <SelectTrigger className="w-[130px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeField(index)} className="h-8 w-8 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
