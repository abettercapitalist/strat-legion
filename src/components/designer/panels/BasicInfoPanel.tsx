import { useState } from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TeamCombobox } from "@/components/admin/TeamCombobox";
import { PlayApprovalSection, type PlayApprovalConfig } from "@/components/admin/PlayApprovalSection";

export interface BasicInfoFormData {
  name: string;
  display_name: string;
  description?: string;
  team_category: string;
}

interface BasicInfoPanelProps {
  register: UseFormRegister<BasicInfoFormData>;
  errors: FieldErrors<BasicInfoFormData>;
  setValue: UseFormSetValue<BasicInfoFormData>;
  watch: UseFormWatch<BasicInfoFormData>;
  isEditing: boolean;
  // Metadata for edit mode
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  version?: number | null;
  // Approval
  playApprovalConfig: PlayApprovalConfig;
  onApprovalConfigChange: (config: PlayApprovalConfig) => void;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const variant =
    status === "Active" ? "default" : status === "Draft" ? "secondary" : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

export function BasicInfoPanel({
  register,
  errors,
  setValue,
  watch,
  isEditing,
  status,
  createdAt,
  updatedAt,
  version,
  playApprovalConfig,
  onApprovalConfigChange,
}: BasicInfoPanelProps) {
  const [approvalOpen, setApprovalOpen] = useState(false);

  const descriptionValue = watch("description") || "";
  const displayNameValue = watch("display_name") || "";
  const teamCategory = watch("team_category");

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Metadata row (edit mode only) */}
        {isEditing && (
          <div className="space-y-2 pb-3 border-b">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {version != null && (
                <span className="text-xs text-muted-foreground">v{version}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Created</span>
              <span>{formatTimestamp(createdAt)}</span>
              <span>Updated</span>
              <span>{formatTimestamp(updatedAt)}</span>
            </div>
          </div>
        )}

        {/* Basic Info Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Basic Info
          </h3>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">
                Name {!isEditing && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="name"
                placeholder="e.g., Enterprise SaaS Play"
                {...register("name")}
                disabled={isEditing}
                className={`${isEditing ? "bg-muted cursor-not-allowed" : ""} ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="display_name" className="text-sm font-semibold">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                placeholder="e.g., Deal, Matter, Project"
                {...register("display_name")}
                className={errors.display_name ? "border-destructive" : ""}
              />
              {displayNameValue.length > 30 && (
                <p className="text-xs text-amber-600">
                  Display names longer than 30 characters may be truncated
                </p>
              )}
              {errors.display_name && (
                <p className="text-xs text-destructive">
                  {errors.display_name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of when to use this play"
                rows={3}
                {...register("description")}
                className={`resize-none ${errors.description ? "border-destructive" : ""}`}
                style={{ minHeight: "64px", maxHeight: "160px" }}
              />
              <div className="flex justify-end">
                <p className="text-xs text-muted-foreground">
                  {descriptionValue.length}/500
                </p>
              </div>
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Team */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Assigned Team <span className="text-destructive">*</span>
              </Label>
              <TeamCombobox
                value={teamCategory}
                onValueChange={(value) => setValue("team_category", value)}
                placeholder="Select a team..."
                error={errors.team_category?.message}
                requireSubgroupWhenAvailable={true}
              />
            </div>
          </div>
        </div>

        {/* Approval Section (collapsible) */}
        <Collapsible open={approvalOpen} onOpenChange={setApprovalOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between px-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-transparent"
            >
              Approval
              <ChevronDown
                className={`h-4 w-4 transition-transform ${approvalOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <PlayApprovalSection
              config={playApprovalConfig}
              onChange={onApprovalConfigChange}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ScrollArea>
  );
}
