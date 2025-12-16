import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [usedByCount, setUsedByCount] = useState<number>(0);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

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
      if (isEditing && id) {
        const { error } = await supabase
          .from("approval_templates")
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Approval template updated");
      } else {
        const { error } = await supabase.from("approval_templates").insert({
          name: name.trim(),
          description: description.trim() || null,
          approval_sequence: [],
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
