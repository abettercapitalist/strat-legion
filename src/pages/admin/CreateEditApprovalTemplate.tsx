import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Lightbulb } from "lucide-react";
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

  // Handle save
  const handleSave = async () => {
    // Final validation
    const nameValidation = nameSchema.safeParse(name);
    if (!nameValidation.success) {
      setNameError(nameValidation.error.errors[0].message);
      return;
    }

    const descValidation = descriptionSchema.safeParse(description);
    if (!descValidation.success) {
      setDescriptionError(descValidation.error.errors[0].message);
      return;
    }

    // Check uniqueness one more time
    const uniquenessError = await validateName(name);
    if (uniquenessError) {
      setNameError(uniquenessError);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare routes data for storage - serialize conditions to plain objects
      const routesData = routes.map((r) => ({
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

      if (isEditing && id) {
        const { error } = await supabase
          .from("approval_templates")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            approval_sequence: routesData as unknown as any,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Approval template updated");
      } else {
        const { error } = await supabase.from("approval_templates").insert({
          name: name.trim(),
          description: description.trim() || null,
          approval_sequence: routesData as unknown as any,
          status: "draft",
        });

        if (error) throw error;
        toast.success("Approval template created");
      }

      navigate("/play-library/approval-templates");
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("Failed to save template");
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
            onClick={handleSave}
            disabled={isSaving || isLoading || Boolean(nameError) || !name.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Template"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
