import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { UpstreamOutput, InputRef } from '../outputSchemas';
import type { BrickCategory } from '@/lib/bricks/types';
import { BRICK_COLORS } from '../utils';

interface UpstreamBindingSelectProps {
  upstreamOutputs: UpstreamOutput[];
  value: InputRef | undefined;
  onChange: (ref: InputRef | undefined) => void;
  label: string;
  description?: string;
  filterCategories?: BrickCategory[];
}

/** Encode an InputRef as a select value string */
function encodeValue(ref: InputRef): string {
  return `${ref.node_id}::${ref.output_key}`;
}

/** Decode a select value string back to an InputRef, using upstream data for labels */
function decodeValue(value: string, upstreamOutputs: UpstreamOutput[]): InputRef | undefined {
  if (!value || value === '__none__') return undefined;
  const [nodeId, outputKey] = value.split('::');
  const upstream = upstreamOutputs.find((u) => u.nodeId === nodeId);
  if (!upstream) return undefined;
  const field = upstream.fields.find((f) => f.name === outputKey);
  return {
    node_id: nodeId,
    node_label: upstream.nodeLabel,
    output_key: outputKey,
    output_label: field?.description || outputKey,
  };
}

export function UpstreamBindingSelect({
  upstreamOutputs,
  value,
  onChange,
  label,
  description,
  filterCategories,
}: UpstreamBindingSelectProps) {
  const filtered = filterCategories
    ? upstreamOutputs.filter((u) => filterCategories.includes(u.brickCategory))
    : upstreamOutputs;

  const currentValue = value ? encodeValue(value) : '__none__';

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Select
        value={currentValue}
        onValueChange={(val) => onChange(decodeValue(val, filtered))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select upstream output..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {filtered.map((upstream) => {
            const colors = BRICK_COLORS[upstream.brickCategory];
            return (
              <SelectGroup key={upstream.nodeId}>
                <SelectLabel className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${colors.badge}`}>
                    {upstream.brickCategory}
                  </span>
                  <span className="text-xs">{upstream.nodeLabel}</span>
                </SelectLabel>
                {upstream.fields.map((field) => (
                  <SelectItem
                    key={`${upstream.nodeId}::${field.name}`}
                    value={`${upstream.nodeId}::${field.name}`}
                  >
                    {upstream.nodeLabel} &rsaquo; {field.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
