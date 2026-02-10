import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle } from 'lucide-react';

interface DocumentationFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function DocumentationForm({ config, onSubmit, isSubmitting }: DocumentationFormProps) {
  const [generated, setGenerated] = useState(false);
  const templateId = config.template_id as string | undefined;
  const outputName = (config.output_name as string) || 'Document';

  const handleGenerate = () => {
    setGenerated(true);
    onSubmit({
      action: 'generate',
      template_id: templateId,
      output_name: outputName,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{outputName}</span>
        {templateId && <span className="text-xs">({templateId})</span>}
      </div>
      {generated && !isSubmitting ? (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          Document generation initiated
        </div>
      ) : (
        <Button onClick={handleGenerate} disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : 'Generate Document'}
        </Button>
      )}
    </div>
  );
}
