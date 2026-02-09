import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentationBrickFormProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export function DocumentationBrickForm({ config, onConfigChange }: DocumentationBrickFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Template</Label>
        <p className="text-xs text-muted-foreground">Select the document template to generate</p>
        <Select
          value={(config.template_id as string) || ''}
          onValueChange={(value) => onConfigChange({ template_id: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
            <SelectItem value="msa">Master Service Agreement</SelectItem>
            <SelectItem value="sow">Statement of Work</SelectItem>
            <SelectItem value="order_form">Order Form</SelectItem>
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
