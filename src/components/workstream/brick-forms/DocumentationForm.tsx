import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentationFormProps {
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function DocumentationForm({ config, onSubmit, isSubmitting }: DocumentationFormProps) {
  const documentId = config.document_id as string | undefined;
  const docStatus = config.status as string | undefined;
  const outputName = (config.output_name as string) || 'Document';
  const templateId = config.template_id as string | undefined;

  const [polledStatus, setPolledStatus] = useState<string | null>(docStatus || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll workstream_documents for status changes when generating
  useEffect(() => {
    if (!documentId) return;
    if (polledStatus === 'ready' || polledStatus === 'completed' || polledStatus === 'error' || polledStatus === 'failed') {
      return;
    }

    const poll = async () => {
      const { data, error } = await supabase
        .from('workstream_documents')
        .select('status, error_message')
        .eq('id', documentId)
        .single();

      if (error) return;

      if (data.status === 'ready' || data.status === 'completed') {
        setPolledStatus(data.status);
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Auto-resume execution
        onSubmit({ document_id: documentId });
      } else if (data.status === 'error' || data.status === 'failed') {
        setPolledStatus(data.status);
        setErrorMessage(data.error_message || 'Document generation failed');
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setPolledStatus(data.status);
      }
    };

    // Initial check
    poll();
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [documentId, polledStatus, onSubmit]);

  // Generating state — show spinner
  if (documentId && polledStatus !== 'ready' && polledStatus !== 'completed' && polledStatus !== 'error' && polledStatus !== 'failed') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{outputName}</span>
        </div>
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating document...
        </div>
      </div>
    );
  }

  // Ready state — show success
  if (documentId && (polledStatus === 'ready' || polledStatus === 'completed')) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{outputName}</span>
        </div>
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          Document generated successfully
        </div>
      </div>
    );
  }

  // Error state
  if (documentId && (polledStatus === 'error' || polledStatus === 'failed')) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{outputName}</span>
        </div>
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {errorMessage || 'Document generation failed'}
        </div>
      </div>
    );
  }

  // Initial state — show Generate button
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{outputName}</span>
        {templateId && <span className="text-xs">({templateId})</span>}
      </div>
      <Button
        onClick={() => onSubmit({ action: 'generate', template_id: templateId, output_name: outputName })}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : 'Generate Document'}
      </Button>
    </div>
  );
}
