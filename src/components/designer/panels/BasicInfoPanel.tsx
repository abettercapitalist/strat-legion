import { useState, useCallback, type KeyboardEvent } from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MultiTeamCombobox } from "@/components/admin/MultiTeamCombobox";
import { PlayApprovalSection, type PlayApprovalConfig } from "@/components/admin/PlayApprovalSection";

/** Parse team_category: handles JSON array strings, plain UUIDs, and legacy names */
function parseTeamIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* not JSON */ }
  return [raw]; // legacy single value
}

function serializeTeamIds(ids: string[]): string {
  return JSON.stringify(ids);
}

export interface BasicInfoFormData {
  name: string;
  display_name: string;
  description?: string;
  team_category: string;
}

export interface PlayMetadata {
  tags: string[];
  priority: "low" | "medium" | "high" | "";
  estimated_duration: string;
  triggered_by: string;
  icon: string;
  color: string;
}

export const DEFAULT_PLAY_METADATA: PlayMetadata = {
  tags: [],
  priority: "",
  estimated_duration: "",
  triggered_by: "",
  icon: "",
  color: "",
};

const PLAY_COLORS = [
  { value: "", label: "Default" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
];

const PLAY_ICONS = [
  { value: "", label: "None" },
  { value: "briefcase", label: "Briefcase" },
  { value: "handshake", label: "Handshake" },
  { value: "scale", label: "Scale" },
  { value: "file-text", label: "Document" },
  { value: "shield", label: "Shield" },
  { value: "zap", label: "Lightning" },
  { value: "target", label: "Target" },
  { value: "rocket", label: "Rocket" },
];

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
  // Play metadata
  playMetadata: PlayMetadata;
  onPlayMetadataChange: (metadata: PlayMetadata) => void;
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
  playMetadata,
  onPlayMetadataChange,
}: BasicInfoPanelProps) {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const descriptionValue = watch("description") || "";
  const displayNameValue = watch("display_name") || "";
  const teamCategory = watch("team_category");

  const updateMeta = useCallback(
    (patch: Partial<PlayMetadata>) => {
      onPlayMetadataChange({ ...playMetadata, ...patch });
    },
    [playMetadata, onPlayMetadataChange]
  );

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
        e.preventDefault();
        const tag = tagInput.trim().toLowerCase();
        if (!playMetadata.tags.includes(tag)) {
          updateMeta({ tags: [...playMetadata.tags, tag] });
        }
        setTagInput("");
      }
      if (e.key === "Backspace" && !tagInput && playMetadata.tags.length > 0) {
        updateMeta({ tags: playMetadata.tags.slice(0, -1) });
      }
    },
    [tagInput, playMetadata.tags, updateMeta]
  );

  const removeTag = useCallback(
    (tag: string) => {
      updateMeta({ tags: playMetadata.tags.filter((t) => t !== tag) });
    },
    [playMetadata.tags, updateMeta]
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Status badge (edit mode only) */}
        {isEditing && (
          <div className="flex items-center gap-2 pb-3 border-b">
            <StatusBadge status={status} />
            {version != null && (
              <span className="text-xs text-muted-foreground">v{version}</span>
            )}
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

            {/* Teams (multi-select) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Assigned Teams <span className="text-destructive">*</span>
              </Label>
              <MultiTeamCombobox
                value={parseTeamIds(teamCategory)}
                onValueChange={(ids) => setValue("team_category", serializeTeamIds(ids))}
                placeholder="Select teams..."
                error={errors.team_category?.message}
              />
            </div>
          </div>
        </div>

        {/* Details Section (collapsible) */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between px-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-transparent"
            >
              Details
              <ChevronDown
                className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-4">
            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Tags{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              {playMetadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {playMetadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder="Type and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Priority{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Select
                value={playMetadata.priority || "none"}
                onValueChange={(v) => updateMeta({ priority: v === "none" ? "" : v as PlayMetadata["priority"] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Estimated Duration{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="e.g., 2-4 weeks"
                value={playMetadata.estimated_duration}
                onChange={(e) => updateMeta({ estimated_duration: e.target.value })}
              />
            </div>

            {/* When to Use */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                When to Use{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                What event or condition should prompt starting this play
              </p>
              <Input
                placeholder="e.g., New enterprise deal > $100k"
                value={playMetadata.triggered_by}
                onChange={(e) => updateMeta({ triggered_by: e.target.value })}
              />
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Icon{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Select
                value={playMetadata.icon || "none"}
                onValueChange={(v) => updateMeta({ icon: v === "none" ? "" : v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select icon..." />
                </SelectTrigger>
                <SelectContent>
                  {PLAY_ICONS.map((icon) => (
                    <SelectItem key={icon.value || "none"} value={icon.value || "none"}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Color{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="flex gap-1.5 flex-wrap">
                {PLAY_COLORS.map((c) => (
                  <button
                    key={c.value || "default"}
                    type="button"
                    title={c.label}
                    onClick={() => updateMeta({ color: c.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      playMetadata.color === c.value
                        ? "ring-2 ring-primary ring-offset-1 border-primary"
                        : "border-border hover:border-foreground/40"
                    }`}
                    style={{
                      backgroundColor: c.value || "#e2e8f0",
                    }}
                  />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

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

        {/* Timestamps (edit mode only, at the bottom) */}
        {isEditing && (createdAt || updatedAt) && (
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Created</span>
              <span>{formatTimestamp(createdAt)}</span>
              <span>Updated</span>
              <span>{formatTimestamp(updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
