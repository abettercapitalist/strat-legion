import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  const [comments, setComments] = useState('');

  const handleChange = (id: string, value: unknown) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const handleOutcome = (outcome: 'pass' | 'fail') => {
    onSubmit({
      review_outcome: outcome,
      criteria_results: values,
      reviewer_comments: comments,
    });
  };

  return (
    <div className="space-y-4">
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
      <div className="space-y-1.5">
        <Label htmlFor="reviewer-comments">Comments</Label>
        <Textarea
          id="reviewer-comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Optional reviewer comments..."
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => handleOutcome('pass')}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
          Pass
        </Button>
        <Button
          onClick={() => handleOutcome('fail')}
          disabled={isSubmitting}
          variant="destructive"
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
          Fail
        </Button>
      </div>
    </div>
  );
}
