import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { ReviewCriterion } from '@/lib/bricks/types';

interface ReviewFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function ReviewForm({ config, onSubmit, isSubmitting }: ReviewFormProps) {
  const reviewType = (config.review_type as string) || 'checklist';
  const criteria = (config.criteria as ReviewCriterion[] | undefined) || [];
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = (id: string, value: unknown) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ review_type: reviewType, criteria_results: values });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {criteria.length === 0 && (
        <p className="text-sm text-muted-foreground">No review criteria configured.</p>
      )}
      {criteria.map((c) => (
        <div key={c.id} className="space-y-1.5">
          <Label htmlFor={c.id}>{c.label}</Label>
          {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
          {reviewType === 'checklist' ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(values[c.id])}
                onChange={(e) => handleChange(c.id, e.target.checked)}
                className="rounded border-input"
              />
              Complete
            </label>
          ) : (
            <Input
              id={c.id}
              type="number"
              min={0}
              max={10}
              placeholder="Score (0-10)"
              value={values[c.id] != null ? String(values[c.id]) : ''}
              onChange={(e) => handleChange(c.id, e.target.valueAsNumber)}
            />
          )}
        </div>
      ))}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Review'}
      </Button>
    </form>
  );
}
