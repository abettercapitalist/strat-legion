import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, X, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { RoleCombobox } from '@/components/admin/RoleCombobox';
import { UserCombobox } from './UserCombobox';
import type { CollectionField, CollectionFieldType } from '@/lib/bricks/types';
import type { UpstreamOutput } from '../outputSchemas';

interface CollectionBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  upstreamOutputs?: UpstreamOutput[];
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

const VALIDATION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
];

export function CollectionBrickForm({ config, onConfigChange, upstreamOutputs = [] }: CollectionBrickFormProps) {
  const fields = (config.fields as CollectionField[]) || [];
  const ownerAssignment = (config.owner_assignment as Record<string, unknown>) || {};
  const ownerType = (ownerAssignment.type as string) || '';
  const instructions = (config.instructions as string) || '';

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

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onConfigChange({ fields: newFields });
  };

  return (
    <div className="space-y-4">
      {upstreamOutputs.length > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Upstream data is available for pre-filling fields from {upstreamOutputs.length}{' '}
            {upstreamOutputs.length === 1 ? 'node' : 'nodes'}.
          </p>
        </div>
      )}

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
            <SelectItem value="workstream_owner">Play Owner</SelectItem>
            <SelectItem value="role">Specific Role</SelectItem>
            <SelectItem value="user">Specific User</SelectItem>
          </SelectContent>
        </Select>
        {ownerType === 'role' && (
          <RoleCombobox
            value={(ownerAssignment.role_id as string) || undefined}
            onValueChange={(roleId) =>
              onConfigChange({ owner_assignment: { type: 'role', role_id: roleId } })
            }
            placeholder="Select role..."
          />
        )}
        {ownerType === 'user' && (
          <UserCombobox
            value={(ownerAssignment.user_id as string) || undefined}
            onValueChange={(userId, roleId) =>
              onConfigChange({ owner_assignment: { type: 'user', user_id: userId, role_id: roleId } })
            }
            placeholder="Select user..."
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Instructions for assigned user</Label>
        <Textarea
          placeholder="Explain what information is needed and why..."
          value={instructions}
          onChange={(e) => onConfigChange({ instructions: e.target.value })}
          rows={3}
        />
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
          <FieldCard
            key={index}
            field={field}
            index={index}
            totalFields={fields.length}
            onUpdate={(updates) => updateField(index, updates)}
            onRemove={() => removeField(index)}
            onMove={(dir) => moveField(index, dir)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Field Card ──────────────────────────────────────────────────────────

interface FieldCardProps {
  field: CollectionField;
  index: number;
  totalFields: number;
  onUpdate: (updates: Partial<CollectionField>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

function FieldCard({ field, index, totalFields, onUpdate, onRemove, onMove }: FieldCardProps) {
  const [optionInput, setOptionInput] = useState('');
  const showOptions = field.field_type === 'select' || field.field_type === 'multi_select';

  const addOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    const current = field.options || [];
    if (!current.includes(trimmed)) {
      onUpdate({ options: [...current, trimmed] });
    }
    setOptionInput('');
  };

  const removeOption = (opt: string) => {
    onUpdate({ options: (field.options || []).filter((o) => o !== opt) });
  };

  const updateValidation = (updates: Partial<NonNullable<CollectionField['validation']>>) => {
    onUpdate({ validation: { ...(field.validation || {}), ...updates } });
  };

  return (
    <div className="p-3 border rounded-md space-y-3 bg-muted/30">
      {/* Row 1: label, type, required, remove */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Field label"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          className="flex-1 h-8 text-sm"
        />
        <Select
          value={field.field_type}
          onValueChange={(value) => onUpdate({ field_type: value as CollectionFieldType })}
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
        <div className="flex items-center gap-1.5">
          <Switch
            checked={field.required ?? false}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
            className="scale-75"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Req</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Row 2: description + default value */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input
            placeholder="Help text for this field"
            value={field.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value || undefined })}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Default value</Label>
          <Input
            placeholder="Default"
            value={field.default_value != null ? String(field.default_value) : ''}
            onChange={(e) => onUpdate({ default_value: e.target.value || undefined })}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Options editor (select / multi_select only) */}
      {showOptions && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Options</Label>
          <div className="flex gap-1.5">
            <Input
              placeholder="Add option + Enter"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              className="h-7 text-xs flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-7 text-xs px-2">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(field.options || []).map((opt) => (
              <Badge key={opt} variant="secondary" className="text-xs gap-1 pr-1">
                {opt}
                <button type="button" onClick={() => removeOption(opt)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Validation (collapsible) */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
          Validation
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={field.validation?.type || 'none'}
                onValueChange={(value) => updateValidation({ type: value === 'none' ? undefined : value })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {VALIDATION_TYPES.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pattern (regex)</Label>
              <Input
                placeholder="e.g., ^[A-Z]+"
                value={field.validation?.pattern || ''}
                onChange={(e) => updateValidation({ pattern: e.target.value || undefined })}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min</Label>
              <Input
                type="number"
                value={field.validation?.min ?? ''}
                onChange={(e) => updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max</Label>
              <Input
                type="number"
                value={field.validation?.max ?? ''}
                onChange={(e) => updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min len</Label>
              <Input
                type="number"
                value={field.validation?.min_length ?? ''}
                onChange={(e) => updateValidation({ min_length: e.target.value ? Number(e.target.value) : undefined })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max len</Label>
              <Input
                type="number"
                value={field.validation?.max_length ?? ''}
                onChange={(e) => updateValidation({ max_length: e.target.value ? Number(e.target.value) : undefined })}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Error message</Label>
            <Input
              placeholder="Custom error message"
              value={field.validation?.error_message || ''}
              onChange={(e) => updateValidation({ error_message: e.target.value || undefined })}
              className="h-7 text-xs"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Reorder buttons */}
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === 0}
          onClick={() => onMove('up')}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === totalFields - 1}
          onClick={() => onMove('down')}
          className="h-6 w-6 p-0"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
