import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UpstreamOutput } from '../outputSchemas';
import { extractTemplateVariables, analyzeTemplateCoverage } from '../templateAnalysis';
import { TemplateGapAnalysis } from './TemplateGapAnalysis';
import { useTemplates, type Template } from '@/hooks/useTemplates';

interface DocumentationBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  upstreamOutputs?: UpstreamOutput[];
}

export function DocumentationBrickForm({ config, onConfigChange, upstreamOutputs = [] }: DocumentationBrickFormProps) {
  const { templates, drafts, loading } = useTemplates();
  const allTemplates = [...templates, ...drafts];

  const handleTemplateChange = (templateId: string) => {
    const patch: Record<string, unknown> = { template_id: templateId };
    // Auto-suggest output name based on the selected template
    const currentName = (config.output_name as string) || '';
    const selected = allTemplates.find((t) => t.id === templateId);
    const wasAutoSuggested = !currentName || allTemplates.some(
      (t) => currentName === `{{workstream.name}} - ${t.name}`
    );
    if (wasAutoSuggested && selected) {
      patch.output_name = `{{workstream.name}} - ${selected.name}`;
    }
    onConfigChange(patch);
  };

  // Resolve current template name for display
  const currentTemplateId = (config.template_id as string) || '';
  const currentTemplate = allTemplates.find((t) => t.id === currentTemplateId);

  const analyzedVariables = useMemo(() => {
    if (!currentTemplate?.content) return [];
    const vars = extractTemplateVariables(currentTemplate.content);
    return analyzeTemplateCoverage(vars, upstreamOutputs);
  }, [currentTemplate?.content, upstreamOutputs]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Template</Label>
        <p className="text-xs text-muted-foreground">Select the document template to generate</p>
        <Select
          value={currentTemplateId}
          onValueChange={handleTemplateChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading ? 'Loading templates...' : 'Select template'}>
              {currentTemplate?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {loading && (
              <SelectItem value="__loading__" disabled>Loading...</SelectItem>
            )}
            {!loading && allTemplates.length === 0 && (
              <SelectItem value="__empty__" disabled>No templates found</SelectItem>
            )}
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
            {drafts.length > 0 && (
              <>
                {drafts.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (Draft)
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        {currentTemplateId && !currentTemplate && !loading && (
          <p className="text-[11px] text-amber-600">
            Selected template not found — it may have been deleted
          </p>
        )}
      </div>

      {currentTemplate?.content && analyzedVariables.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Template Variables</Label>
          <TemplateGapAnalysis variables={analyzedVariables} />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Output Format</Label>
        <Select
          value={(config.output_format as string) || 'pdf'}
          onValueChange={(value) => onConfigChange({ output_format: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="docx">Word (DOCX)</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Output Name</Label>
        <p className="text-xs text-muted-foreground">Name for the generated document</p>
        <Input
          placeholder="e.g., {{workstream.name}} - NDA"
          value={(config.output_name as string) || ''}
          onChange={(e) => onConfigChange({ output_name: e.target.value })}
        />
      </div>
    </div>
  );
}
