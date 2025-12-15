import { ExternalLink, Pencil } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApprovalTemplates } from "@/hooks/useApprovalTemplates";
import { Skeleton } from "@/components/ui/skeleton";

interface ApprovalWorkflowSectionProps {
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
}

export function ApprovalWorkflowSection({
  selectedTemplateId,
  onTemplateChange,
}: ApprovalWorkflowSectionProps) {
  const { templates, loading, error } = useApprovalTemplates();

  const selectedTemplate = templates.find(
    (t) => t.id === selectedTemplateId
  );

  return (
    <div className="space-y-6" style={{ marginTop: "48px" }}>
      <div>
        <h2 className="text-lg font-medium text-foreground border-b pb-2">
          Approval Workflow
        </h2>
      </div>

      {/* Approval Template Dropdown */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Approval Template <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground italic">
          Select the approval workflow for this play
        </p>
        {loading ? (
          <Skeleton className="h-10 w-full max-w-md" />
        ) : (
          <Select
            value={selectedTemplateId || ""}
            onValueChange={(value) => onTemplateChange(value || null)}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select an approval template" />
            </SelectTrigger>
            <SelectContent>
              {error ? (
                <div className="p-2 text-sm text-destructive">
                  {error}
                </div>
              ) : templates.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No approval templates - Create one first
                </div>
              ) : (
                templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.gateCount} {template.gateCount === 1 ? "gate" : "gates"})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}

        {/* Links */}
        <div className="flex items-center gap-4 pt-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Create New Approval Template
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled={!selectedTemplateId}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit Template
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Preview:</Label>
        <div className="bg-muted/50 border rounded-lg p-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
          ) : !selectedTemplateId ? (
            <p className="text-sm text-muted-foreground italic">
              Select an approval template to see preview
            </p>
          ) : !selectedTemplate ? (
            <p className="text-sm text-muted-foreground italic">
              Template not found
            </p>
          ) : (
            <div className="space-y-4">
              {selectedTemplate.gates.map((gate, gateIndex) => (
                <div key={gateIndex}>
                  <p className="text-sm font-medium text-foreground">
                    {gate.name}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {gate.approvers.map((approver, approverIndex) => (
                      <li
                        key={approverIndex}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-muted-foreground/60">•</span>
                        <span>
                          {approver.role} ({approver.sla})
                          {approver.conditional && (
                            <span className="text-xs italic ml-1">
                              — {approver.conditional}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
