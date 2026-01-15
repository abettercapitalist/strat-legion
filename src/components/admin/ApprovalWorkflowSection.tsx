import { ExternalLink, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApprovalTemplates, ApprovalRoute } from "@/hooks/useApprovalTemplates";
import { Skeleton } from "@/components/ui/skeleton";

interface ApprovalWorkflowSectionProps {
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
}

function getThresholdText(route: ApprovalRoute): string {
  const threshold = (route as any).approval_threshold || "unanimous";
  const minApprovals = (route as any).minimum_approvals || 1;
  const percentageRequired = (route as any).percentage_required || 50;
  const approverCount = route.approvers?.length || 0;

  switch (threshold) {
    case "unanimous":
      return "All must approve";
    case "minimum":
      return `${minApprovals} of ${approverCount} required`;
    case "percentage":
      return `${percentageRequired}% required`;
    case "any_one":
      return "Any one approver";
    default:
      return "All must approve";
  }
}

function getModeText(route: ApprovalRoute): string {
  const mode = (route as any).approval_mode || "serial";
  return mode === "parallel" ? "Parallel" : "Serial";
}

export function ApprovalWorkflowSection({
  selectedTemplateId,
  onTemplateChange,
}: ApprovalWorkflowSectionProps) {
  const navigate = useNavigate();
  
  // Filter to only active templates for the dropdown
  const { templates, loading, error } = useApprovalTemplates(true);

  const selectedTemplate = templates.find(
    (t) => t.id === selectedTemplateId
  );

  const handleCreateNew = () => {
    navigate("/admin/approval-templates/new");
  };

  const handleEditTemplate = () => {
    if (selectedTemplateId) {
      navigate(`/admin/approval-templates/${selectedTemplateId}/edit`);
    }
  };

  return (
    <div className="space-y-6" style={{ marginTop: "48px" }}>
      <div>
        <h2 className="text-lg font-medium text-foreground border-b pb-2">
          Approval Workflow
        </h2>
      </div>

      {/* Approval Route Dropdown */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Approval Route <span className="text-destructive">*</span>
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
              <SelectValue placeholder="Select an approval route" />
            </SelectTrigger>
            <SelectContent>
              {error ? (
                <div className="p-2 text-sm text-destructive">
                  {error}
                </div>
              ) : templates.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  <p>No approval routes available</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateNew();
                    }}
                  >
                    Create one first →
                  </Button>
                </div>
              ) : (
                templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.routeCount} {template.routeCount === 1 ? "route" : "routes"})
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
            onClick={handleCreateNew}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Create New Approval Route
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled={!selectedTemplateId}
            onClick={handleEditTemplate}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit Route
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Preview:</Label>
        <div className="bg-muted/50 border rounded-lg p-4 font-mono text-xs overflow-x-auto">
          {loading ? (
            <p className="text-muted-foreground">Loading preview...</p>
          ) : !selectedTemplateId ? (
            <p className="text-muted-foreground italic font-sans text-sm">
              Select an approval route to see preview
            </p>
          ) : !selectedTemplate ? (
            <p className="text-muted-foreground italic font-sans text-sm">
              Template not found
            </p>
          ) : selectedTemplate.routes.length === 0 ? (
            <p className="text-muted-foreground italic font-sans text-sm">
              No routes configured in this template
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTemplate.routes.map((route, routeIndex) => {
                const isConditional = (route as any).is_conditional;
                const conditionText = (route as any).condition_description;
                const autoApproveRules = (route as any).auto_approve_rules;
                const approvalMode = getModeText(route);
                const thresholdText = getThresholdText(route);

                return (
                  <div key={route.id || routeIndex}>
                    {/* Route box */}
                    <pre className="text-foreground whitespace-pre">
{`┌${"─".repeat(45)}┐
│ ${route.route_name.padEnd(43)} │`}
                    </pre>
                    
                    {isConditional && conditionText && (
                      <pre className="text-foreground whitespace-pre">
{`│ ${`(Conditional: ${conditionText})`.slice(0, 43).padEnd(43)} │`}
                      </pre>
                    )}
                    
                    <pre className="text-foreground whitespace-pre">
{`│${"".padEnd(45)}│`}
                    </pre>

                    {/* Approvers */}
                    {route.approvers && route.approvers.length > 0 ? (
                      <>
                        {route.approvers.map((approver, aIdx) => {
                          const slaText = approver.sla_hours ? `${approver.sla_hours}h SLA` : "No SLA";
                          const connector = aIdx < route.approvers.length - 1 
                            ? (approvalMode === "Parallel" ? "──┐" : "   ")
                            : (approvalMode === "Parallel" && route.approvers.length > 1 ? "──┘" : "   ");
                          const modeIndicator = aIdx === Math.floor(route.approvers.length / 2) && route.approvers.length > 1
                            ? `├─→ ${approvalMode}`
                            : "";
                          const approverLine = `  ${approver.role} (${slaText})`;
                          
                          return (
                            <pre key={aIdx} className="text-foreground whitespace-pre">
{`│${approverLine.padEnd(38)}${connector}${modeIndicator.padEnd(7 - connector.length > 0 ? 7 - connector.length : 0)}│`}
                            </pre>
                          );
                        })}
                      </>
                    ) : (
                      <pre className="text-foreground whitespace-pre">
{`│   No approvers configured${" ".repeat(19)}│`}
                      </pre>
                    )}

                    <pre className="text-foreground whitespace-pre">
{`│${"".padEnd(45)}│`}
                    </pre>

                    {/* Threshold */}
                    <pre className="text-foreground whitespace-pre">
{`│  Threshold: ${thresholdText.padEnd(31)} │`}
                    </pre>

                    {/* Auto-approve rules */}
                    {autoApproveRules && autoApproveRules.length > 0 && (
                      <pre className="text-foreground whitespace-pre">
{`│  Auto-approve: ${autoApproveRules[0].slice(0, 28).padEnd(28)} │`}
                      </pre>
                    )}

                    <pre className="text-foreground whitespace-pre">
{`└${"─".repeat(45)}┘`}
                    </pre>

                    {/* Arrow to next route */}
                    {routeIndex < selectedTemplate.routes.length - 1 && (
                      <pre className="text-foreground whitespace-pre text-center">
{`              ↓`}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}