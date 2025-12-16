import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Lightbulb, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ApprovalRouteCard, ApprovalRouteData } from "@/components/admin/ApprovalRouteCard";
import { v4 as uuidv4 } from "uuid";

const MAX_ROUTES = 10;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    "Name can only contain letters, numbers, spaces, hyphens, and underscores"
  );

const descriptionSchema = z
  .string()
  .max(500, "Description must be less than 500 characters")
  .optional();

export default function CreateEditApprovalTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [routes, setRoutes] = useState<ApprovalRouteData[]>([]);
  const [usedByCount, setUsedByCount] = useState<number>(0);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Fetch existing template when editing
  useEffect(() => {
    if (!id) return;

    const fetchTemplate = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from("approval_templates")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error("Template not found");
          navigate("/play-library/approval-templates");
          return;
        }

        setName(data.name);
        setDescription(data.description || "");
        setStatus((data.status as "draft" | "active" | "archived") || "draft");

        // Parse routes from approval_sequence
        const sequence = data.approval_sequence as unknown;
        if (Array.isArray(sequence)) {
          const parsedRoutes: ApprovalRouteData[] = sequence.map((item: any, index: number) => ({
            id: item.id || uuidv4(),
            position: item.position || index + 1,
            route_type: item.route_type || "pre_deal",
            custom_route_name: item.custom_route_name || "",
            is_conditional: item.is_conditional || false,
            conditions: item.conditions || [],
            condition_logic: item.condition_logic || "AND",
            auto_approval_enabled: item.auto_approval_enabled || false,
            auto_approval_conditions: item.auto_approval_conditions || [],
            auto_approval_fallback_role: item.auto_approval_fallback_role || "",
            notification_message: item.notification_message || "",
            approval_mode: item.approval_mode || "serial",
            approval_threshold: item.approval_threshold || "unanimous",
            minimum_approvals: item.minimum_approvals || 2,
            percentage_required: item.percentage_required || 67,
            approvers_count: item.approvers_count || 3,
          }));
          setRoutes(parsedRoutes);
        }

        // Fetch usage count
        const { count, error: countError } = await supabase
          .from("workstream_types")
          .select("*", { count: "exact", head: true })
          .eq("approval_template_id", id);

        if (!countError && count !== null) {
          setUsedByCount(count);
        }
      } catch (err) {
        console.error("Error fetching template:", err);
        toast.error("Failed to load template");
      } finally {
        setIsFetching(false);
      }
    };

    fetchTemplate();
  }, [id, navigate]);

  // Route management functions
  const handleAddRoute = () => {
    if (routes.length >= MAX_ROUTES) return;
    
    const newRoute: ApprovalRouteData = {
      id: uuidv4(),
      position: routes.length + 1,
      route_type: "pre_deal",
      custom_route_name: "",
      is_conditional: false,
      conditions: [],
      condition_logic: "AND",
      auto_approval_enabled: false,
      auto_approval_conditions: [],
      auto_approval_fallback_role: "",
      notification_message: "",
      approval_mode: "serial",
      approval_threshold: "unanimous",
      minimum_approvals: 2,
      percentage_required: 67,
      approvers_count: 3,
    };
    setRoutes([...routes, newRoute]);
  };

  const handleUpdateRoute = (routeId: string, updates: Partial<ApprovalRouteData>) => {
    setRoutes(routes.map((r) => (r.id === routeId ? { ...r, ...updates } : r)));
  };

  const handleRemoveRoute = (routeId: string) => {
    const newRoutes = routes.filter((r) => r.id !== routeId);
    // Recalculate positions
    const reordered = newRoutes.map((r, index) => ({
      ...r,
      position: index + 1,
    }));
    setRoutes(reordered);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newRoutes = [...routes];
    const [draggedRoute] = newRoutes.splice(draggedIndex, 1);
    newRoutes.splice(dropIndex, 0, draggedRoute);

    // Recalculate positions
    const reordered = newRoutes.map((r, index) => ({
      ...r,
      position: index + 1,
    }));

    setRoutes(reordered);
    setDraggedIndex(null);
  };

  // Validate name with uniqueness check
  const validateName = useCallback(
    async (value: string): Promise<string | null> => {
      const result = nameSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0].message;
      }

      // Check uniqueness
      const { data, error } = await supabase
        .from("approval_templates")
        .select("id")
        .eq("name", value.trim())
        .maybeSingle();

      if (error) {
        console.error("Error checking name uniqueness:", error);
        return null;
      }

      if (data && data.id !== id) {
        return "An approval template with this name already exists";
      }

      return null;
    },
    [id]
  );

  // Handle name change with debounced validation
  const handleNameChange = async (value: string) => {
    setName(value);
    
    // Basic validation immediately
    const result = nameSchema.safeParse(value);
    if (!result.success) {
      setNameError(result.error.errors[0].message);
      return;
    }
    
    setNameError(null);
    
    // Debounce uniqueness check
    setIsLoading(true);
    const error = await validateName(value);
    setNameError(error);
    setIsLoading(false);
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    const result = descriptionSchema.safeParse(value);
    if (!result.success) {
      setDescriptionError(result.error.errors[0].message);
    } else {
      setDescriptionError(null);
    }
  };

  // Prepare routes data for storage
  const prepareRoutesData = () => routes.map((r) => ({
    id: r.id,
    position: r.position,
    route_type: r.route_type,
    custom_route_name: r.custom_route_name || "",
    is_conditional: r.is_conditional,
    conditions: (r.conditions || []).map((c) => ({ ...c })),
    condition_logic: r.condition_logic,
    auto_approval_enabled: r.auto_approval_enabled,
    auto_approval_conditions: (r.auto_approval_conditions || []).map((c) => ({ ...c })),
    auto_approval_fallback_role: r.auto_approval_fallback_role || "",
    notification_message: r.notification_message || "",
    approval_mode: r.approval_mode || "serial",
    approval_threshold: r.approval_threshold || "unanimous",
    minimum_approvals: r.minimum_approvals || 2,
    percentage_required: r.percentage_required || 67,
    approvers_count: r.approvers_count || 3,
    approvers: [],
  }));

  // Validate for activation
  const validateForActivation = async (): Promise<string[]> => {
    const errors: string[] = [];

    // Name validation
    if (!name.trim()) {
      errors.push("Name is required");
    } else {
      const uniquenessError = await validateName(name);
      if (uniquenessError) {
        errors.push(`Name already exists - try "${name} v2"`);
      }
    }

    // At least one route
    if (routes.length === 0) {
      errors.push("At least one route is required");
    }

    // Check for duplicate route types (unless custom)
    const routeTypeCounts: Record<string, number> = {};
    routes.forEach((r) => {
      if (r.route_type !== "custom") {
        routeTypeCounts[r.route_type] = (routeTypeCounts[r.route_type] || 0) + 1;
      }
    });
    Object.entries(routeTypeCounts).forEach(([type, count]) => {
      if (count > 1) {
        const typeLabel = {
          pre_deal: "Pre-Deal Approval",
          proposal: "Proposal Approval",
          closing: "Closing Approval",
        }[type] || type;
        errors.push(`Duplicate route type "${typeLabel}" - use unique names or Custom Route`);
      }
    });

    // Each route needs at least one approver (checking fallback role as proxy for now)
    routes.forEach((r, index) => {
      if (!r.auto_approval_fallback_role && !r.auto_approval_enabled) {
        errors.push(`Route ${index + 1} needs at least one approver`);
      }
    });

    return errors;
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setValidationErrors([]);
    
    try {
      const routesData = prepareRoutesData();

      if (isEditing && id) {
        const { error } = await supabase
          .from("approval_templates")
          .update({
            name: name.trim() || "Untitled Template",
            description: description.trim() || null,
            approval_sequence: routesData as unknown as any,
            status: "draft",
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("approval_templates").insert({
          name: name.trim() || "Untitled Template",
          description: description.trim() || null,
          approval_sequence: routesData as unknown as any,
          status: "draft",
        });

        if (error) throw error;
      }

      toast.success("Draft saved");
      setStatus("draft");
    } catch (err) {
      console.error("Error saving draft:", err);
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle activate
  const handleActivate = async () => {
    setIsSaving(true);
    setValidationErrors([]);

    // Validate
    const errors = await validateForActivation();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsSaving(false);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const routesData = prepareRoutesData();

      if (isEditing && id) {
        const { error } = await supabase
          .from("approval_templates")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            approval_sequence: routesData as unknown as any,
            status: status,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Approval template activated successfully");
      } else {
        const { error } = await supabase.from("approval_templates").insert({
          name: name.trim(),
          description: description.trim() || null,
          approval_sequence: routesData as unknown as any,
          status: "active",
        });

        if (error) throw error;
        toast.success("Approval template activated successfully");
      }

      navigate("/play-library/approval-templates");
    } catch (err) {
      console.error("Error activating template:", err);
      toast.error("Failed to activate template");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto p-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate("/play-library/approval-templates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Approval Templates
        </Button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? "Edit Approval Template" : "Create Approval Template"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing
              ? "Update the approval workflow configuration"
              : "Define a new approval workflow for your business processes"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-lg border p-8">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Please fix the following errors:</p>
                  <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Basic Information
            </h2>

            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Enterprise 3-Gate Approval"
                  maxLength={100}
                  className={nameError ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Internal identifier for this approval workflow
                </p>
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Brief description of when to use this approval workflow"
                  maxLength={500}
                  rows={3}
                  className={`resize-none min-h-[80px] max-h-[240px] ${
                    descriptionError ? "border-destructive" : ""
                  }`}
                  style={{
                    height: description.length > 150 ? "auto" : undefined,
                  }}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {descriptionError && (
                      <p className="text-xs text-destructive">
                        {descriptionError}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500
                  </p>
                </div>
              </div>

              {/* Used by count (edit mode only) */}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Used by {usedByCount} play{usedByCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Approval Routes */}
          <div style={{ marginTop: "48px" }}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">
                Approval Routes
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Define the sequence of approval routes in this workflow
              </p>
            </div>

            {/* Add Route Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRoute}
                      disabled={routes.length >= MAX_ROUTES}
                      className="mb-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Route
                    </Button>
                  </div>
                </TooltipTrigger>
                {routes.length >= MAX_ROUTES && (
                  <TooltipContent>
                    <p>Maximum 10 routes per template</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Route Cards */}
            <div className="space-y-3">
              {routes.map((route, index) => (
                <ApprovalRouteCard
                  key={route.id}
                  route={route}
                  index={index}
                  onUpdate={handleUpdateRoute}
                  onRemove={handleRemoveRoute}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={draggedIndex === index}
                />
              ))}
            </div>

            {/* Tip */}
            {routes.length > 1 && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Routes execute in sequence. Drag to reorder routes.</span>
              </div>
            )}
          </div>

          {/* Section 3: Preview */}
          <div style={{ marginTop: "48px" }}>
            <button
              type="button"
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h2 className="text-base font-semibold text-foreground">Preview</h2>
              <span className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {previewExpanded ? (
                  <>
                    Collapse <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Expand <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </span>
            </button>

            {previewExpanded && (
              <div className="mt-4 font-mono text-sm bg-muted/50 rounded-lg p-4 overflow-x-auto">
                {routes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Add routes to see preview</p>
                ) : (
                  <div className="space-y-2">
                    {routes.map((route, index) => {
                      const routeTypeLabels: Record<string, string> = {
                        pre_deal: "Pre-Deal Approval",
                        proposal: "Proposal Approval",
                        closing: "Closing Approval",
                        custom: route.custom_route_name || "Custom Route",
                      };
                      const routeName = routeTypeLabels[route.route_type] || route.route_type;
                      const approverRole = route.auto_approval_fallback_role
                        ? route.auto_approval_fallback_role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                        : "Approver";
                      
                      const thresholdText = {
                        unanimous: "All must approve",
                        minimum: `${route.minimum_approvals || 2} out of ${route.approvers_count || 3} required`,
                        percentage: `${route.percentage_required || 67}% required`,
                        any_one: "Any one approver (first wins)",
                      }[route.approval_threshold] || "All must approve";

                      const modeText = route.approval_mode === "parallel" ? "Parallel" : "Serial";

                      return (
                        <div key={route.id}>
                          <pre className="text-foreground whitespace-pre">
{`┌${"─".repeat(45)}┐
│ ${routeName.padEnd(44)}│
│${" ".repeat(46)}│`}
{route.auto_approval_enabled ? `
│  Auto-approve if conditions met${" ".repeat(13)}│` : ""}
{`│  ${approverRole} (SLA: TBD)${" ".repeat(Math.max(0, 24 - approverRole.length))}──┐${" ".repeat(8)}│
│${" ".repeat(37)}├─→ ${modeText}${" ".repeat(Math.max(0, 4 - modeText.length))}│`}
{route.is_conditional ? `
│  *Conditional route${" ".repeat(26)}│` : ""}
{`│${" ".repeat(46)}│
│  Threshold: ${thresholdText.padEnd(32)}│
└${"─".repeat(45)}┘`}
                          </pre>
                          {index < routes.length - 1 && (
                            <pre className="text-muted-foreground text-center">
                              {"              ↓"}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Status & Activation */}
          <div style={{ marginTop: "48px" }}>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Status & Activation
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === "draft"}
                  onChange={() => setStatus("draft")}
                  className="w-4 h-4"
                />
                <div>
                  <span className="text-sm font-medium">Draft</span>
                  <p className="text-xs text-muted-foreground">Not available for plays</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="w-4 h-4"
                />
                <div>
                  <span className="text-sm font-medium">Active</span>
                  <p className="text-xs text-muted-foreground">Available for use</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === "archived"}
                  onChange={() => setStatus("archived")}
                  className="w-4 h-4"
                />
                <div>
                  <span className="text-sm font-medium">Archived</span>
                  <p className="text-xs text-muted-foreground">Read-only, existing workstreams unaffected</p>
                </div>
              </label>
            </div>

            {/* Warning for archiving used templates */}
            {isEditing && status === "archived" && usedByCount > 0 && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700">
                    This template is used by {usedByCount} play{usedByCount !== 1 ? "s" : ""}. 
                    Archiving will prevent new workstreams from using it, but existing workstreams 
                    will continue to function.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/play-library/approval-templates")}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSaving}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft"
            )}
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isSaving || isSavingDraft}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate Approval Template"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
