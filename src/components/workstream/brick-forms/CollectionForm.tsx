import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Info, ChevronRight } from 'lucide-react';
import type { CollectionField } from '@/lib/bricks/types';

interface CollectionFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CollectionForm({ config, onSubmit, isSubmitting }: CollectionFormProps) {
  const fields = (config.fields as CollectionField[] | undefined) || [];
  const instructions = config.instructions as string | undefined;
  const upstreamContext = (config.upstream_context as Record<string, unknown>) || {};
  const validationErrors = (config.validation_errors as Record<string, string>) || {};

  // Initialize values with defaults
  const defaultValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    const allFields = (config.all_fields as CollectionField[] | undefined) || fields;
    for (const field of allFields) {
      if (field.default_value !== undefined && field.default_value !== null) {
        defaults[field.name] = field.default_value;
      }
    }
    return defaults;
  }, [config.all_fields, fields]);

  const [values, setValues] = useState<Record<string, unknown>>(defaultValues);

  const handleChange = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const upstreamEntries = Object.entries(upstreamContext).filter(
    ([, v]) => v != null && v !== '',
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Instructions box */}
      {instructions && (
        <div className="flex gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">{instructions}</p>
        </div>
      )}

      {/* Upstream context (collapsible) */}
      {upstreamEntries.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
            Background information
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
              {upstreamEntries.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground shrink-0">{humanizeKey(k)}</span>
                  <span className="text-right truncate">{String(v)}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Editable fields */}
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No fields configured. Click submit to continue.</p>
      )}
      {fields.map((field) => {
        const error = validationErrors[field.name];
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {renderField(field, values[field.name], (v) => handleChange(field.name, v))}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        );
      })}
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
      return (
        <Input
          id={field.name}
          type="number"
          value={strValue}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          required={field.required}
        />
      );
    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            id={field.name}
            type="number"
            value={strValue}
            onChange={(e) => onChange(e.target.valueAsNumber)}
            required={field.required}
            className="pl-7"
            step="0.01"
          />
        </div>
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
    case 'multi_select': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-1.5 border rounded-md p-2">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter((s) => s !== opt));
                  }
                }}
                className="rounded border-input"
              />
              {opt}
            </label>
          ))}
          {(!field.options || field.options.length === 0) && (
            <p className="text-xs text-muted-foreground italic">No options configured</p>
          )}
        </div>
      );
    }
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
    case 'file':
      return (
        <div className="space-y-1">
          <Input
            id={field.name}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onChange(file ? file.name : undefined);
            }}
            required={field.required}
          />
          {strValue && (
            <p className="text-xs text-muted-foreground">Selected: {strValue}</p>
          )}
        </div>
      );
    case 'deadline': {
      const totalHours = typeof value === 'number' ? value : 0;
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      return (
        <div className="flex gap-2">
          <div className="space-y-1 flex-1">
            <Label className="text-xs text-muted-foreground">Days</Label>
            <Input
              type="number"
              min={0}
              value={days}
              onChange={(e) => {
                const d = Math.max(0, Number(e.target.value) || 0);
                onChange(d * 24 + hours);
              }}
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs text-muted-foreground">Hours</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => {
                const h = Math.min(23, Math.max(0, Number(e.target.value) || 0));
                onChange(days * 24 + h);
              }}
            />
          </div>
        </div>
      );
    }
    case 'address': {
      // TODO: integrate address autocomplete provider
      const addr = (typeof value === 'object' && value !== null ? value : {}) as Record<string, string>;
      const set = (key: string, v: string) => onChange({ ...addr, [key]: v });
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Street</Label>
            <Input value={addr.street || ''} onChange={(e) => set('street', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input value={addr.city || ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">State</Label>
              <Input value={addr.state || ''} onChange={(e) => set('state', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">ZIP</Label>
              <Input value={addr.zip || ''} onChange={(e) => set('zip', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input value={addr.country || ''} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
        </div>
      );
    }
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
