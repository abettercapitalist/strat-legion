import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TEMPLATES: Record<string, string> = {
  nda: 'Non-Disclosure Agreement',
  msa: 'Master Service Agreement',
  sow: 'Statement of Work',
  order_form: 'Order Form',
};

interface DocumentationBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export function DocumentationBrickForm({ config, onConfigChange }: DocumentationBrickFormProps) {
  const handleTemplateChange = (templateId: string) => {
    const patch: Record<string, unknown> = { template_id: templateId };
    // Auto-suggest output name if empty or still matches a previous auto-suggestion
    const currentName = (config.output_name as string) || '';
    const isAutoSuggested = !currentName || Object.values(TEMPLATES).some(
      (label) => currentName === `{{workstream.name}} - ${label}`
    );
    if (isAutoSuggested && TEMPLATES[templateId]) {
      patch.output_name = `{{workstream.name}} - ${TEMPLATES[templateId]}`;
    }
    onConfigChange(patch);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Template</Label>
        <p className="text-xs text-muted-foreground">Select the document template to generate</p>
        <Select
          value={(config.template_id as string) || ''}
          onValueChange={handleTemplateChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATES).map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
