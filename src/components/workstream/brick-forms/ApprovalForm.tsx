import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';

interface ApprovalFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function ApprovalForm({ config, onSubmit, isSubmitting }: ApprovalFormProps) {
  const [reasoning, setReasoning] = useState('');
  const decisionOptions = (config.decision_options as string[] | undefined) || ['approve', 'reject', 'request_info'];

  const handleDecision = (decision: string) => {
    onSubmit({ approval_decision: decision, approval_reasoning: reasoning });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reasoning">Reasoning</Label>
        <Textarea
          id="reasoning"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder="Provide your reasoning..."
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        {decisionOptions.includes('approve') && (
          <Button
            onClick={() => handleDecision('approve')}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Approve
          </Button>
        )}
        {decisionOptions.includes('reject') && (
          <Button
            onClick={() => handleDecision('reject')}
            disabled={isSubmitting}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
            Reject
          </Button>
        )}
        {decisionOptions.includes('request_info') && (
          <Button
            onClick={() => handleDecision('request_info')}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4 mr-1" />}
            Request Info
          </Button>
        )}
      </div>
    </div>
  );
}
