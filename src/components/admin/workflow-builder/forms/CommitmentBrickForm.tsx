import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X, AlertTriangle } from 'lucide-react';
import type { SignerConfig } from '@/lib/bricks/types';
import type { UpstreamOutput } from '../outputSchemas';

interface CommitmentBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  availableDocuments?: UpstreamOutput[];
}

export function CommitmentBrickForm({ config, onConfigChange, availableDocuments = [] }: CommitmentBrickFormProps) {
  const signers = (config.signers as SignerConfig[]) || [];
  const provider = (config.provider as string) || 'manual';
  const documentSource = (config.document_source as string) || 'previous_brick';
  const documentId = (config.document_id as string) || '';

  const updateSigner = (index: number, updates: Partial<SignerConfig>) => {
    const newSigners = signers.map((s, i) => (i === index ? { ...s, ...updates } : s));
    onConfigChange({ signers: newSigners });
  };

  const addSigner = () => {
    const newSigner: SignerConfig = {
      name: '',
      email: '',
      role: '',
      order: signers.length + 1,
    };
    onConfigChange({ signers: [...signers, newSigner] });
  };

  const removeSigner = (index: number) => {
    onConfigChange({ signers: signers.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Signature Provider</Label>
        <Select
          value={provider}
          onValueChange={(value) => onConfigChange({ provider: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="docusign">DocuSign</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Document Source</Label>
        <Select
          value={documentSource}
          onValueChange={(value) => onConfigChange({ document_source: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="previous_brick">From previous brick</SelectItem>
            <SelectItem value="template">From template</SelectItem>
            <SelectItem value="upload">Manual upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {documentSource === 'previous_brick' && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Document</Label>
          {availableDocuments.length === 0 ? (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="text-xs">
                No documents found upstream. Add a documentation brick before this brick or change the document source.
              </p>
            </div>
          ) : (
            <Select
              value={documentId}
              onValueChange={(value) => onConfigChange({ document_id: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document" />
              </SelectTrigger>
              <SelectContent>
                {availableDocuments.map((brick) => (
                  <SelectItem key={brick.nodeId} value={brick.nodeId}>
                    {brick.nodeLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Signers</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSigner} className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" />
            Add Signer
          </Button>
        </div>
        {signers.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No signers defined. Add signers who need to sign the document.</p>
        )}
        {signers.map((signer, index) => (
          <div key={index} className="p-3 border rounded-md space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Signer {index + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSigner(index)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              placeholder="Role (e.g., Client, Company Rep)"
              value={signer.role || ''}
              onChange={(e) => updateSigner(index, { role: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      {provider === 'manual' && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Reminder Frequency (hours)</Label>
          <Input
            type="number"
            placeholder="e.g., 24"
            value={((config.reminders as Record<string, unknown>)?.frequency_hours as number) || ''}
            onChange={(e) =>
              onConfigChange({
                reminders: {
                  ...((config.reminders as Record<string, unknown>) || {}),
                  frequency_hours: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
            className="w-32"
          />
        </div>
      )}
    </div>
  );
}
