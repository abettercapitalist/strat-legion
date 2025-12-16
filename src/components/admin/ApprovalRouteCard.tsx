import { useState } from "react";
import { GripVertical, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export interface ApprovalRouteData {
  id: string;
  position: number;
  route_name: string;
  route_type: string;
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
  { value: "deal_review", label: "Deal Review" },
  { value: "legal_review", label: "Legal Review" },
  { value: "finance_review", label: "Finance Review" },
  { value: "executive_approval", label: "Executive Approval" },
  { value: "final_approval", label: "Final Approval" },
  { value: "custom", label: "Custom" },
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
              Route {route.position}: {route.route_name || routeTypeLabel}
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
        <div className="grid grid-cols-2 gap-4 pl-8">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Route Name
            </Label>
            <Input
              value={route.route_name}
              onChange={(e) =>
                onUpdate(route.id, { route_name: e.target.value })
              }
              placeholder="e.g., Legal Review"
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Route Type
            </Label>
            <Select
              value={route.route_type}
              onValueChange={(value) =>
                onUpdate(route.id, { route_type: value })
              }
            >
              <SelectTrigger className="h-9">
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
