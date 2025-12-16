import { useState } from "react";
import { GripVertical, X, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface RouteCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface ApprovalRouteData {
  id: string;
  position: number;
  route_type: string;
  custom_route_name?: string;
  is_conditional: boolean;
  conditions: RouteCondition[];
  condition_logic: "AND" | "OR";
  auto_approval_enabled: boolean;
  auto_approval_conditions: RouteCondition[];
  auto_approval_fallback_role?: string;
  notification_message?: string;
}

interface ApprovalRouteCardProps {
  route: ApprovalRouteData;
  index: number;
  onUpdate: (id: string, updates: Partial<ApprovalRouteData>) => void;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
}

const ROUTE_TYPES = [
  { value: "pre_deal", label: "Pre-Deal Approval" },
  { value: "proposal", label: "Proposal Approval" },
  { value: "closing", label: "Closing Approval" },
  { value: "custom", label: "Custom Route" },
];

const CONDITION_FIELDS = [
  { value: "deal_value", label: "Deal Value" },
  { value: "customer_type", label: "Customer Type" },
  { value: "region", label: "Region" },
  { value: "industry", label: "Industry" },
  { value: "has_custom_clauses", label: "Has Custom Clauses" },
  { value: "contract_duration", label: "Contract Duration" },
];

const CONDITION_OPERATORS = [
  { value: "=", label: "=" },
  { value: "!=", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: "≥" },
  { value: "<=", label: "≤" },
  { value: "contains", label: "contains" },
];

const APPROVER_ROLES = [
  { value: "general_counsel", label: "General Counsel" },
  { value: "legal_ops", label: "Legal Ops" },
  { value: "contract_counsel", label: "Contract Counsel" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "finance_reviewer", label: "Finance Reviewer" },
];

export function ApprovalRouteCard({
  route,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: ApprovalRouteCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const routeTypeLabel = ROUTE_TYPES.find((t) => t.value === route.route_type)?.label || "Unknown";
  const displayName = route.route_type === "custom" && route.custom_route_name 
    ? route.custom_route_name 
    : routeTypeLabel;

  const addCondition = (type: "conditions" | "auto_approval_conditions") => {
    const newCondition: RouteCondition = {
      id: crypto.randomUUID(),
      field: "deal_value",
      operator: ">",
      value: "",
    };
    const currentConditions = route[type] || [];
    onUpdate(route.id, { [type]: [...currentConditions, newCondition] });
  };

  const updateCondition = (
    type: "conditions" | "auto_approval_conditions",
    conditionId: string,
    updates: Partial<RouteCondition>
  ) => {
    const currentConditions = route[type] || [];
    const updated = currentConditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c
    );
    onUpdate(route.id, { [type]: updated });
  };

  const removeCondition = (type: "conditions" | "auto_approval_conditions", conditionId: string) => {
    const currentConditions = route[type] || [];
    onUpdate(route.id, { [type]: currentConditions.filter((c) => c.id !== conditionId) });
  };

  const renderConditionBuilder = (
    type: "conditions" | "auto_approval_conditions",
    conditions: RouteCondition[]
  ) => (
    <div className="space-y-3 mt-3 pl-6">
      {conditions.map((condition, idx) => (
        <div key={condition.id} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">
            {idx === 0 ? "Condition:" : type === "conditions" ? (route.condition_logic === "AND" ? "AND" : "OR") : "AND"}
          </span>
          <Select
            value={condition.field}
            onValueChange={(value) => updateCondition(type, condition.id, { field: value })}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={condition.operator}
            onValueChange={(value) => updateCondition(type, condition.id, { operator: value })}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={condition.value}
            onChange={(e) => updateCondition(type, condition.id, { value: e.target.value })}
            placeholder="Value"
            className="h-8 w-32"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-destructive"
            onClick={() => removeCondition(type, condition.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addCondition(type)}
        className="h-8"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Condition
      </Button>
      {type === "conditions" && conditions.length > 1 && (
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-muted-foreground">Logic:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={`logic-${route.id}`}
              checked={route.condition_logic === "AND"}
              onChange={() => onUpdate(route.id, { condition_logic: "AND" })}
              className="w-3 h-3"
            />
            <span className="text-xs">AND (all must be true)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={`logic-${route.id}`}
              checked={route.condition_logic === "OR"}
              onChange={() => onUpdate(route.id, { condition_logic: "OR" })}
              className="w-3 h-3"
            />
            <span className="text-xs">OR (any must be true)</span>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        className={`border rounded-lg p-4 bg-card transition-all ${
          isDragging ? "opacity-50 border-primary" : "border-border"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="cursor-grab hover:text-primary transition-colors text-muted-foreground"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Route {route.position}: {displayName}
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-destructive"
            onClick={() => setShowConfirmDialog(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6 pl-8">
          {/* 1. Route Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Route Type
            </Label>
            <Select
              value={route.route_type}
              onValueChange={(value) =>
                onUpdate(route.id, { route_type: value, custom_route_name: value === "custom" ? "" : undefined })
              }
            >
              <SelectTrigger className="h-9 w-64">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {route.route_type === "custom" && (
              <div className="mt-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Custom Route Name
                </Label>
                <Input
                  value={route.custom_route_name || ""}
                  onChange={(e) =>
                    onUpdate(route.id, { custom_route_name: e.target.value.slice(0, 50) })
                  }
                  placeholder="Enter custom route name"
                  className="h-9 w-64 mt-1"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(route.custom_route_name || "").length}/50 characters
                </p>
              </div>
            )}
          </div>

          {/* 2. Conditional Route */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Conditional Route:
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`conditional-${route.id}`}
                checked={route.is_conditional}
                onCheckedChange={(checked) =>
                  onUpdate(route.id, { is_conditional: !!checked })
                }
              />
              <label
                htmlFor={`conditional-${route.id}`}
                className="text-sm cursor-pointer"
              >
                Only trigger this route if conditions are met
              </label>
            </div>
            {route.is_conditional && renderConditionBuilder("conditions", route.conditions || [])}
          </div>

          {/* 3. Auto-Approval Rules */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Auto-Approval:
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`auto-approval-${route.id}`}
                checked={route.auto_approval_enabled}
                onCheckedChange={(checked) =>
                  onUpdate(route.id, { auto_approval_enabled: !!checked })
                }
              />
              <label
                htmlFor={`auto-approval-${route.id}`}
                className="text-sm cursor-pointer"
              >
                Auto-approve if conditions met
              </label>
            </div>
            {route.auto_approval_enabled && (
              <div className="mt-3 pl-6 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Auto-approve this route if ALL conditions are true:
                </p>
                {renderConditionBuilder("auto_approval_conditions", route.auto_approval_conditions || [])}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">Otherwise require approval from:</span>
                  <Select
                    value={route.auto_approval_fallback_role || ""}
                    onValueChange={(value) =>
                      onUpdate(route.id, { auto_approval_fallback_role: value })
                    }
                  >
                    <SelectTrigger className="h-8 w-48">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Custom Notification Message */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Notification Message (optional)
            </Label>
            <Textarea
              value={route.notification_message || ""}
              onChange={(e) =>
                onUpdate(route.id, { notification_message: e.target.value.slice(0, 500) })
              }
              placeholder="Custom message sent to approvers when this route triggers"
              rows={2}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {(route.notification_message || "").length}/500 characters · Leave blank to use default notification
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Route</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this route and all its approvers?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRemove(route.id);
                setShowConfirmDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
