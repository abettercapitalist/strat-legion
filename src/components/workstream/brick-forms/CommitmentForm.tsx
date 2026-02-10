import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenTool, Loader2, CheckCircle, Clock } from 'lucide-react';
import type { SignerConfig } from '@/lib/bricks/types';

interface CommitmentFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function CommitmentForm({ config, onSubmit, isSubmitting }: CommitmentFormProps) {
  const provider = (config.provider as string) || 'manual';
  const signers = (config.signers as SignerConfig[] | undefined) || [];

  const handleMarkComplete = () => {
    onSubmit({ action: 'mark_complete', provider });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PenTool className="h-4 w-4" />
        <span>Signature collection ({provider})</span>
      </div>

      {signers.length > 0 && (
        <div className="space-y-2">
          {signers.map((signer, i) => (
            <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
              <div>
                <span className="font-medium">{signer.name || signer.email || `Signer ${i + 1}`}</span>
                {signer.role && <span className="text-muted-foreground ml-2">({signer.role})</span>}
              </div>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
          ))}
        </div>
      )}

      {signers.length === 0 && (
        <p className="text-sm text-muted-foreground">No signers configured.</p>
      )}

      <Button onClick={handleMarkComplete} disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
        ) : (
          <><CheckCircle className="h-4 w-4 mr-2" />Mark Complete</>
        )}
      </Button>
    </div>
  );
}
