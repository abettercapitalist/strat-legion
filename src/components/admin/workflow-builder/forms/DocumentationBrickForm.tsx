import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UpstreamOutput, InputRef } from '../outputSchemas';
import { UpstreamBindingSelect } from './UpstreamBindingSelect';
import { useTemplates, type Template } from '@/hooks/useTemplates';

interface DocumentationBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  upstreamOutputs?: UpstreamOutput[];
}

export function DocumentationBrickForm({ config, onConfigChange, upstreamOutputs = [] }: DocumentationBrickFormProps) {
  const { templates, drafts, loading } = useTemplates();
  const allTemplates = [...templates, ...drafts];
  const dataSourceRef = config.data_source_ref as InputRef | undefined;
  const collectionUpstream = upstreamOutputs.filter((u) => u.brickCategory === 'collection');

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

  return (
    <div className="space-y-4">
      {collectionUpstream.length > 0 && (
        <div className="space-y-1.5">
          <UpstreamBindingSelect
            upstreamOutputs={upstreamOutputs}
            value={dataSourceRef}
            onChange={(ref) => onConfigChange({ data_source_ref: ref })}
            label="Data Source"
            description="Select the collection brick that provides field data for this document"
            filterCategories={['collection']}
          />
          {dataSourceRef && (
            <p className="text-[11px] text-muted-foreground">
              Field mappings can reference collected fields from this source
            </p>
          )}
        </div>
      )}

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
