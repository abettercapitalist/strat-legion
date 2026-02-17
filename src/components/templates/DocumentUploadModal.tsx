import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Loader2, CheckCircle2, AlertCircle, ChevronRight, FileUp } from 'lucide-react';
import { parseDocument, readFileAsBase64, ParsedDocument } from '@/lib/api/documentParser';
import { useTemplates } from '@/hooks/useTemplates';
import { useClauses } from '@/hooks/useClauses';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'review' | 'error';

export function DocumentUploadModal({ open, onOpenChange, onSuccess }: DocumentUploadModalProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [extractedHtml, setExtractedHtml] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createTemplate } = useTemplates();
  const { createClausesBatch } = useClauses();

  const resetState = useCallback(() => {
    setState('idle');
    setProgress(0);
    setError(null);
    setParsedDoc(null);
    setExtractedHtml(null);
    setSelectedFile(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const validTypes = ['.txt', '.docx', '.doc', '.rtf', '.pdf'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(extension)) {
      setError('Please upload a text, Word, or PDF document.');
      setState('error');
      return;
    }

    setSelectedFile(file);
    setState('uploading');
    setProgress(20);

    try {
      // Read file content as base64
      const content = await readFileAsBase64(file);
      setProgress(40);

      setState('parsing');
      setProgress(60);

      // Parse with AI
      const result = await parseDocument(content, file.name, file.type);
      setProgress(90);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to parse document');
      }

      setParsedDoc(result.data);
      if (result.extractedHtml) {
        setExtractedHtml(result.extractedHtml);
      }
      setProgress(100);
      setState('review');

    } catch (err) {
      console.error('Error processing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to process document');
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

  const handleCreateTemplate = async () => {
    if (!parsedDoc || isSaving) return;

    setIsSaving(true);

    try {
      // First, create clauses in the database
      const clausesData = parsedDoc.clauses.map(clause => ({
        title: clause.title,
        category: clause.category,
        text: clause.text,
        risk_level: clause.riskLevel,
        is_standard: clause.isStandard,
        business_context: clause.businessContext,
      }));

      await createClausesBatch(clausesData);

      // Use Unstructured HTML if available (preserves original formatting), otherwise fall back to clause-based generation
      let fullContent: string;
      if (extractedHtml) {
        fullContent = extractedHtml;
      } else {
        const clauseContent = parsedDoc.clauses.map((clause, index) =>
          `<h2>${index + 1}. ${clause.title}</h2>\n<p>${clause.text}</p>`
        ).join('\n\n');
        fullContent = `<h1>${parsedDoc.suggestedName}</h1>\n\n${clauseContent}`;
      }

      // Save template to database
      const template = await createTemplate(
        parsedDoc.suggestedName,
        fullContent,
        parsedDoc.suggestedCategory,
        'Draft'
      );

      toast({
        title: 'Template created',
        description: `"${parsedDoc.suggestedName}" has been saved as a draft with ${parsedDoc.clauses.length} clauses.`,
      });

      handleClose();
      onSuccess?.();
      
      // Navigate to edit the new template
      if (template) {
        navigate(`/law/templates/${template.id}/edit`);
      }
    } catch (err) {
      console.error('Error creating template:', err);
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-status-error/10 text-status-error border-status-error/20';
      case 'medium': return 'bg-status-warning/10 text-status-warning border-status-warning/20';
      default: return 'bg-status-success/10 text-status-success border-status-success/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Document as Template</DialogTitle>
          <DialogDescription>
            Upload a contract document to automatically extract clauses and create a reusable template.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
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
                accept=".txt,.docx,.doc,.rtf,.pdf"
                className="hidden"
              />
              <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Drop your document here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports .docx, .doc, .txt, .rtf, and .pdf files
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}

          {(state === 'uploading' || state === 'parsing') && (
            <div className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="font-medium mb-2">
                {state === 'uploading' ? 'Reading document...' : 'Analyzing clauses...'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {state === 'uploading' 
                  ? 'Extracting text from your document'
                  : 'AI is identifying and categorizing clauses'}
              </p>
              <Progress value={progress} className="max-w-xs mx-auto" />
            </div>
          )}

          {state === 'error' && (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="font-medium mb-2">Failed to process document</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={resetState}>
                Try Again
              </Button>
            </div>
          )}

          {state === 'review' && parsedDoc && (
            <div className="space-y-4 overflow-hidden flex flex-col h-full">
              {/* Document Summary */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-status-success flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{parsedDoc.suggestedName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{parsedDoc.summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{parsedDoc.suggestedCategory}</Badge>
                    <Badge variant="outline">{parsedDoc.clauses.length} clauses</Badge>
                    {parsedDoc.definitions.length > 0 && (
                      <Badge variant="outline">{parsedDoc.definitions.length} definitions</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Clauses Preview */}
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-medium mb-2">Extracted Clauses</h4>
                <ScrollArea className="h-[250px] border rounded-lg">
                  <div className="divide-y">
                    {parsedDoc.clauses.map((clause, index) => (
                      <div key={clause.id} className="p-3 hover:bg-muted/20">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              {index + 1}.
                            </span>
                            <span className="font-medium">{clause.title}</span>
                          </div>
                          <Badge variant="outline" className={getRiskBadgeVariant(clause.riskLevel)}>
                            {clause.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
                          {clause.businessContext}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Create Template
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
