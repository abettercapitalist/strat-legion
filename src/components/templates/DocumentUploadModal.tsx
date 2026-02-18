import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, AlertCircle, FileUp } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type UploadState = 'idle' | 'processing' | 'error';

export function DocumentUploadModal({ open, onOpenChange, onSuccess }: DocumentUploadModalProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createTemplate } = useTemplates();

  const resetState = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!['docx', 'txt'].includes(extension || '')) {
      setError('Please upload a .docx or .txt file.');
      setState('error');
      return;
    }

    setState('processing');

    try {
      let htmlContent: string;
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

      if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value;
        if (result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
      } else {
        const text = await file.text();
        htmlContent = text
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => `<p>${line}</p>`)
          .join('\n');
      }

      const template = await createTemplate(nameWithoutExt, htmlContent, 'Services', 'Draft');

      toast({
        title: 'Template imported',
        description: `"${nameWithoutExt}" has been saved as a draft.`,
      });

      handleClose();
      onSuccess?.();

      if (template) {
        navigate(`/law/templates/${template.id}/edit`);
      }
    } catch (err) {
      console.error('Error importing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to import document');
      setState('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Document as Template</DialogTitle>
          <DialogDescription>
            Upload a .docx or .txt file to create a new draft template.
          </DialogDescription>
        </DialogHeader>

        {state === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept=".docx,.txt"
              className="hidden"
            />
            <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Drop your document here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports .docx and .txt files
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}

        {state === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <h3 className="font-medium mb-2">Importing document...</h3>
            <p className="text-sm text-muted-foreground">Converting and saving as template</p>
          </div>
        )}

        {state === 'error' && (
          <div className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="font-medium mb-2">Import failed</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={resetState}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
