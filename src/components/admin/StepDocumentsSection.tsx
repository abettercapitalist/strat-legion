import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplates } from "@/hooks/useTemplates";
import { v4 as uuidv4 } from "uuid";

export interface StepDocument {
  id: string;
  document_type: string;
  template_id?: string;
  template_name?: string;
  is_mandatory: boolean;
}

interface StepDocumentsSectionProps {
  documents: StepDocument[];
  onDocumentsChange: (documents: StepDocument[]) => void;
}

export function StepDocumentsSection({
  documents,
  onDocumentsChange,
}: StepDocumentsSectionProps) {
  const { templates, loading: templatesLoading } = useTemplates();
  const [isAdding, setIsAdding] = useState(false);
  const [newDocument, setNewDocument] = useState<Partial<StepDocument>>({
    document_type: "",
    is_mandatory: true,
  });

  const activeTemplates = templates.filter((t) => t.status === "Active");

  const handleAddDocument = () => {
    if (!newDocument.document_type?.trim()) return;

    const template = activeTemplates.find((t) => t.id === newDocument.template_id);

    const doc: StepDocument = {
      id: uuidv4(),
      document_type: newDocument.document_type.trim(),
      template_id: newDocument.template_id,
      template_name: template?.name,
      is_mandatory: newDocument.is_mandatory ?? true,
    };

    onDocumentsChange([...documents, doc]);
    setNewDocument({ document_type: "", is_mandatory: true });
    setIsAdding(false);
  };

  const handleRemoveDocument = (id: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== id));
  };

  const handleCancel = () => {
    setNewDocument({ document_type: "", is_mandatory: true });
    setIsAdding(false);
  };

  if (documents.length === 0 && !isAdding) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="gap-2 text-muted-foreground"
      >
        <FileText className="h-4 w-4" />
        Add Required Document
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        Required Documents for this Step
      </Label>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate">{doc.document_type}</span>
                {doc.template_name && (
                  <span className="text-muted-foreground ml-1">({doc.template_name})</span>
                )}
              </div>
              <Badge variant={doc.is_mandatory ? "default" : "secondary"} className="text-xs">
                {doc.is_mandatory ? "Required" : "Optional"}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDocument(doc.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Form */}
      {isAdding && (
        <div className="space-y-3 p-3 border rounded-md bg-background">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Document Type</Label>
            <Input
              placeholder="e.g., NDA, Statement of Work"
              value={newDocument.document_type || ""}
              onChange={(e) =>
                setNewDocument({ ...newDocument, document_type: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Linked Template <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={newDocument.template_id || ""}
              onValueChange={(value) =>
                setNewDocument({ ...newDocument, template_id: value || undefined })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <div className="p-2 text-xs text-muted-foreground">Loading...</div>
                ) : activeTemplates.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">No templates</div>
                ) : (
                  activeTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <RadioGroup
            value={newDocument.is_mandatory ? "mandatory" : "optional"}
            onValueChange={(value) =>
              setNewDocument({ ...newDocument, is_mandatory: value === "mandatory" })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mandatory" id="step-doc-mandatory" />
              <Label htmlFor="step-doc-mandatory" className="text-xs cursor-pointer">
                Required
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="optional" id="step-doc-optional" />
              <Label htmlFor="step-doc-optional" className="text-xs cursor-pointer">
                Optional
              </Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel} className="h-7 text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddDocument}
              disabled={!newDocument.document_type?.trim()}
              className="h-7 text-xs"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {!isAdding && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 text-xs h-7"
        >
          <Plus className="h-3 w-3" />
          Add Document
        </Button>
      )}
    </div>
  );
}
