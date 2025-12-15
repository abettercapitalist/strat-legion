import { useState } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
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

export interface RequiredDocument {
  id: string;
  document_type: string;
  template_id?: string;
  template_name?: string;
  is_mandatory: boolean;
  needed_by?: string;
  position: number;
}

const NEEDED_BY_OPTIONS = [
  { value: "pre_deal_approval", label: "Pre-Deal Approval" },
  { value: "proposal_approval", label: "Proposal Approval" },
  { value: "closing_approval", label: "Closing Approval" },
  { value: "signature", label: "Signature" },
  { value: "workflow_completion", label: "Workflow Completion" },
];

interface RequiredDocumentsSectionProps {
  documents: RequiredDocument[];
  onDocumentsChange: (documents: RequiredDocument[]) => void;
}

export function RequiredDocumentsSection({
  documents,
  onDocumentsChange,
}: RequiredDocumentsSectionProps) {
  const { templates, loading: templatesLoading } = useTemplates();
  const [isAdding, setIsAdding] = useState(false);
  const [newDocument, setNewDocument] = useState<Partial<RequiredDocument>>({
    document_type: "",
    is_mandatory: true,
  });

  const activeTemplates = templates.filter((t) => t.status === "Active");

  const handleAddDocument = () => {
    if (!newDocument.document_type?.trim()) return;

    const template = activeTemplates.find((t) => t.id === newDocument.template_id);

    const doc: RequiredDocument = {
      id: uuidv4(),
      document_type: newDocument.document_type.trim(),
      template_id: newDocument.template_id,
      template_name: template?.name,
      is_mandatory: newDocument.is_mandatory ?? true,
      needed_by: newDocument.is_mandatory ? newDocument.needed_by : undefined,
      position: documents.length,
    };

    onDocumentsChange([...documents, doc]);
    setNewDocument({ document_type: "", is_mandatory: true });
    setIsAdding(false);
  };

  const handleRemoveDocument = (id: string) => {
    const updated = documents
      .filter((d) => d.id !== id)
      .map((d, index) => ({ ...d, position: index }));
    onDocumentsChange(updated);
  };

  const handleCancel = () => {
    setNewDocument({ document_type: "", is_mandatory: true });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6" style={{ marginTop: "48px" }}>
      <div>
        <h2 className="text-lg font-medium text-foreground border-b pb-2">
          Required Documents
        </h2>
        <p className="text-xs text-muted-foreground italic mt-2">
          Define the documents needed for this play
        </p>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {doc.document_type}
                  </span>
                  {doc.template_name && (
                    <span className="text-xs text-muted-foreground truncate">
                      ({doc.template_name})
                    </span>
                  )}
                </div>
                {doc.needed_by && (
                  <span className="text-xs text-muted-foreground">
                    Needed by:{" "}
                    {NEEDED_BY_OPTIONS.find((o) => o.value === doc.needed_by)?.label}
                  </span>
                )}
              </div>
              <Badge variant={doc.is_mandatory ? "default" : "secondary"}>
                {doc.is_mandatory ? "Mandatory" : "Optional"}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDocument(doc.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !isAdding && (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            No documents defined yet. Add the first document requirement.
          </p>
        </div>
      )}

      {/* Add Document Form */}
      {isAdding && (
        <div className="space-y-4 p-4 border rounded-lg bg-background">
          {/* Document Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Document Type <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g., Master Service Agreement, NDA"
              value={newDocument.document_type || ""}
              onChange={(e) =>
                setNewDocument({ ...newDocument, document_type: e.target.value })
              }
            />
          </div>

          {/* Linked Template */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Linked Template{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={newDocument.template_id || ""}
              onValueChange={(value) =>
                setNewDocument({
                  ...newDocument,
                  template_id: value || undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Loading templates...
                  </div>
                ) : activeTemplates.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No active templates available
                  </div>
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

          {/* Requirement Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Requirement</Label>
            <RadioGroup
              value={newDocument.is_mandatory ? "mandatory" : "optional"}
              onValueChange={(value) =>
                setNewDocument({
                  ...newDocument,
                  is_mandatory: value === "mandatory",
                  needed_by: value === "optional" ? undefined : newDocument.needed_by,
                })
              }
              className="space-y-2"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="mandatory" id="mandatory" className="mt-1" />
                <div>
                  <Label htmlFor="mandatory" className="text-sm cursor-pointer">
                    Mandatory
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Must be completed to close the deal
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="optional" id="optional" className="mt-1" />
                <div>
                  <Label htmlFor="optional" className="text-sm cursor-pointer">
                    Optional
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recommended but not required
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Needed By (only for mandatory) */}
          {newDocument.is_mandatory && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Needed By <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newDocument.needed_by || ""}
                onValueChange={(value) =>
                  setNewDocument({ ...newDocument, needed_by: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select when this document is needed" />
                </SelectTrigger>
                <SelectContent>
                  {NEEDED_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddDocument}
              disabled={
                !newDocument.document_type?.trim() ||
                (newDocument.is_mandatory && !newDocument.needed_by)
              }
            >
              Add Document
            </Button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!isAdding && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      )}
    </div>
  );
}
