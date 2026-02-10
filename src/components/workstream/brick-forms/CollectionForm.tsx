import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { CollectionField } from '@/lib/bricks/types';

interface CollectionFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function CollectionForm({ config, onSubmit, isSubmitting }: CollectionFormProps) {
  const fields = (config.fields as CollectionField[] | undefined) || [];
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No fields configured. Click submit to continue.</p>
      )}
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {renderField(field, values[field.name], (v) => handleChange(field.name, v))}
        </div>
      ))}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit'}
      </Button>
    </form>
  );
}

function renderField(
  field: CollectionField,
  value: unknown,
  onChange: (v: unknown) => void,
) {
  const strValue = value != null ? String(value) : '';

  switch (field.field_type) {
    case 'textarea':
      return (
        <Textarea
          id={field.name}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case 'number':
    case 'currency':
      return (
        <Input
          id={field.name}
          type="number"
          value={strValue}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          required={field.required}
        />
      );
    case 'date':
      return (
        <Input
          id={field.name}
          type="date"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case 'select':
      return (
        <Select value={strValue} onValueChange={onChange}>
          <SelectTrigger id={field.name}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-input"
          />
          {field.label}
        </label>
      );
    default:
      return (
        <Input
          id={field.name}
          type="text"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
  }
}
