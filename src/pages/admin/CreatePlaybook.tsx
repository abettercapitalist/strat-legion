import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { useWorkstreamTypes } from "@/hooks/useWorkstreamTypes";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { ValidationSummaryPanel, type ValidationError } from "@/components/admin/ValidationSummaryPanel";
import { PlayApprovalConfig } from "@/components/admin/PlayApprovalSection";
import {
  WorkflowCanvasSection,
  type WorkflowCanvasSectionHandle,
} from "@/components/admin/workflow-builder/WorkflowCanvasSection";
import { NodePalette } from "@/components/admin/workflow-builder/NodePalette";
import { NodeConfigPanel } from "@/components/admin/workflow-builder/NodeConfigPanel";
import type { WorkflowRFNode, WorkflowRFEdge } from "@/components/admin/workflow-builder/types";
import { getAvailableUpstreamOutputs, getNearestUpstreamDocuments, getFieldDataFlow } from "@/components/admin/workflow-builder/upstreamContext";
import { useWorkflowPersistence } from "@/components/admin/workflow-builder/hooks/useWorkflowPersistence";
import { BasicInfoPanel, type BasicInfoFormData, type PlayMetadata, DEFAULT_PLAY_METADATA } from "@/components/designer/panels/BasicInfoPanel";

const playbookSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  team_category: z.string().refine(
    (val) => {
      try {
        const arr = JSON.parse(val);
        return Array.isArray(arr) && arr.length > 0;
      } catch {
        return val.length > 0; // legacy single value
      }
    },
    { message: "At least one team is required" }
  ),
});

type PlaybookFormData = z.infer<typeof playbookSchema>;

export default function CreatePlaybook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { createWorkstreamType, updateWorkstreamType } = useWorkstreamTypes();
  const { hasSubgroups, getTeamById } = useTeams();
  const isEditing = Boolean(id);

  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null);
  const [existingUpdatedAt, setExistingUpdatedAt] = useState<string | null>(null);
  const [existingVersion, setExistingVersion] = useState<number | null>(null);
  const [playApprovalConfig, setPlayApprovalConfig] = useState<PlayApprovalConfig>({
    required_roles: [],
    approval_mode: "all",
  });
  const [playMetadata, setPlayMetadata] = useState<PlayMetadata>(DEFAULT_PLAY_METADATA);

  // Selection state for right panel (palette vs config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // Workflow canvas ref and state
  const canvasRef = useRef<WorkflowCanvasSectionHandle>(null);
  const [initialNodes, setInitialNodes] = useState<WorkflowRFNode[]>([]);
  const [initialEdges, setInitialEdges] = useState<WorkflowRFEdge[]>([]);
  const persistence = useWorkflowPersistence();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlaybookFormData>({
    resolver: zodResolver(playbookSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      team_category: undefined,
    },
  });

  const teamCategory = watch("team_category");
  const displayNameValue = watch("display_name") || "";

  // Fetch existing play data for edit mode
  useEffect(() => {
    if (!id) return;

    const fetchPlay = async () => {
      setIsLoadingPlay(true);
      try {
        const { data, error } = await supabase
          .from("workstream_types")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setExistingStatus(data.status);
          setExistingCreatedAt(data.created_at);
          setExistingUpdatedAt(data.updated_at);
          setExistingVersion(data.version ?? null);
          reset({
            name: data.name,
            display_name: data.display_name || "",
            description: data.description || "",
            team_category: data.team_category as PlaybookFormData["team_category"],
          });

          // Load play approval config and play metadata
          if (data.play_approval_config) {
            const pac = data.play_approval_config as Record<string, unknown>;
            const { metadata: savedMeta, ...approvalFields } = pac;
            setPlayApprovalConfig(approvalFields as unknown as PlayApprovalConfig);
            if (savedMeta && typeof savedMeta === "object") {
              setPlayMetadata({ ...DEFAULT_PLAY_METADATA, ...(savedMeta as Partial<PlayMetadata>) });
            }
          }

          // Load DAG workflow from relational tables
          const dagState = await persistence.loadWorkflow(id);
          if (dagState) {
            setInitialNodes(dagState.nodes);
            setInitialEdges(dagState.edges);
          }
        }
      } catch (error) {
        console.error("Failed to fetch play:", error);
        toast({
          title: "Error",
          description: "Failed to load play data.",
          variant: "destructive",
        });
        navigate("/admin/workstream-types");
      } finally {
        setIsLoadingPlay(false);
      }
    };

    fetchPlay();
  }, [id, reset, toast, navigate]);

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateForActivation = useCallback((): boolean => {
    const errs: ValidationError[] = [];

    // Validate team category — parse JSON array and check each team
    let teamIds: string[] = [];
    try {
      const parsed = JSON.parse(teamCategory || "[]");
      if (Array.isArray(parsed)) teamIds = parsed;
    } catch { /* legacy single value */ }
    if (teamIds.length === 0 && teamCategory) teamIds = [teamCategory];

    if (teamIds.length === 0) {
      errs.push({
        id: "team-required",
        section: "basics",
        field: "team_category",
        message: "At least one team must be assigned.",
      });
    }
    for (const tid of teamIds) {
      const team = getTeamById(tid);
      if (team && hasSubgroups(team.id)) {
        errs.push({
          id: `team-subgroup-${tid}`,
          section: "basics",
          field: "team_category",
          message: `"${team.display_name}" has sub-groups. Please select a specific group.`,
        });
      }
    }

    // Validate workflow DAG
    if (canvasRef.current) {
      const dagErrors = canvasRef.current.validate();
      for (const dagErr of dagErrors) {
        if (dagErr.severity === 'error') {
          errs.push({
            id: dagErr.id,
            section: "workflow",
            field: "dag",
            message: dagErr.message,
          });
        }
      }
    }

    setValidationErrors(errs);
    return errs.length === 0;
  }, [teamCategory, getTeamById, hasSubgroups]);

  const onSubmit = async (data: PlaybookFormData, requestedStatus: "Draft" | "Active") => {
    setValidationErrors([]);

    // When editing, preserve existing status unless explicitly activating
    const status = requestedStatus === "Draft" && isEditing && existingStatus
      ? existingStatus as "Draft" | "Active"
      : requestedStatus;

    if (status === "Active" && !validateForActivation()) {
      return;
    }

    try {
      const payload = {
        name: data.name,
        display_name: data.display_name,
        description: data.description || null,
        team_category: data.team_category,
        status,
        default_workflow: JSON.stringify({ steps: [] }), // Legacy field - kept for backwards compat
        play_approval_config: { ...playApprovalConfig, metadata: playMetadata },
      };

      let workstreamTypeId: string;

      if (isEditing && id) {
        await updateWorkstreamType.mutateAsync({ id, ...payload });
        workstreamTypeId = id;
        toast({
          title: "Play saved",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        const result = await createWorkstreamType.mutateAsync(payload);
        workstreamTypeId = result?.id || "";
        toast({
          title: status === "Active" ? "New play activated successfully" : "Draft saved",
        });
      }

      // Save workflow DAG to relational tables
      if (canvasRef.current && workstreamTypeId) {
        const nodes = canvasRef.current.getNodes();
        const edges = canvasRef.current.getEdges();
        if (nodes.length > 0) {
          const result = await persistence.saveWorkflow(workstreamTypeId, data.name, nodes, edges);
          if (!result) {
            toast({
              title: "Workflow save failed",
              description: persistence.error || "Unknown error saving workflow DAG",
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Only navigate away when the user explicitly clicked "Activate"
      if (requestedStatus === "Active") {
        navigate("/admin/workstream-types");
      } else if (!isEditing && workstreamTypeId) {
        // New play saved as draft — redirect to edit URL so refreshes work
        navigate(`/admin/workstream-types/${workstreamTypeId}/edit`, { replace: true });
      }
    } catch (error) {
      console.error("[CreatePlaybook] Save failed:", error);
      toast({
        title: "Error",
        description: "Failed to save play. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsDraft = handleSubmit((data) => onSubmit(data, "Draft"));
  const handleActivate = handleSubmit((data) => onSubmit(data, "Active"));

  // Track selected node/edge objects (not just IDs) to avoid stale ref reads
  const [selectedNode, setSelectedNode] = useState<WorkflowRFNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<WorkflowRFEdge | null>(null);

  // Provide upstream outputs for the config panel — reads live state from canvas ref
  const getUpstreamOutputs = useCallback((nodeId: string) => {
    const nodes = canvasRef.current?.getNodes() ?? [];
    const edges = canvasRef.current?.getEdges() ?? [];
    return getAvailableUpstreamOutputs(nodeId, nodes, edges);
  }, []);

  // Provide nearest upstream documents for the config panel
  const getAvailableDocuments = useCallback((nodeId: string) => {
    const nodes = canvasRef.current?.getNodes() ?? [];
    const edges = canvasRef.current?.getEdges() ?? [];
    return getNearestUpstreamDocuments(nodeId, nodes, edges);
  }, []);

  // Provide field-level data flow for the config panel
  const getFieldDataFlowCallback = useCallback((nodeId: string) => {
    const nodes = canvasRef.current?.getNodes() ?? [];
    const edges = canvasRef.current?.getEdges() ?? [];
    return getFieldDataFlow(nodeId, nodes, edges);
  }, []);

  // Selection change callback from canvas — capture node/edge objects immediately
  const handleSelectionChange = useCallback(
    (nodeId: string | null, edgeId: string | null) => {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(edgeId);
      const nodes = canvasRef.current?.getNodes() ?? [];
      const edges = canvasRef.current?.getEdges() ?? [];
      setSelectedNode(nodeId ? nodes.find((n) => n.id === nodeId) || null : null);
      setSelectedEdge(edgeId ? edges.find((e) => e.id === edgeId) || null : null);
    },
    []
  );

  if (isLoadingPlay) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-4 w-96">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const hasSelection = selectedNodeId !== null || selectedEdgeId !== null;

  return (
    <div className="flex flex-col gap-2 px-2 py-2 h-full overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between shrink-0 px-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/workstream-types")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Play Library
        </Button>
        <h1 className="text-sm font-semibold text-foreground">
          {displayNameValue || (isEditing ? "Edit Play" : "New Play")}
        </h1>
        <div className="w-[160px]" />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="shrink-0">
          <ValidationSummaryPanel
            errors={validationErrors}
            onDismiss={() => setValidationErrors([])}
            onErrorClick={() => {}}
          />
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Left Panel: Basic Info */}
        <Card className="w-[280px] shrink-0 overflow-hidden">
          <BasicInfoPanel
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            isEditing={isEditing}
            status={existingStatus}
            createdAt={existingCreatedAt}
            updatedAt={existingUpdatedAt}
            version={existingVersion}
            playApprovalConfig={playApprovalConfig}
            onApprovalConfigChange={setPlayApprovalConfig}
            playMetadata={playMetadata}
            onPlayMetadataChange={setPlayMetadata}
          />
        </Card>

        {/* Center + Right: Resizable */}
        <Card className="flex-1 min-w-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={75} minSize={50}>
            {/* Center Panel: Canvas */}
            <Card className="h-full overflow-hidden flex flex-col rounded-none border-0">
              {/* Canvas toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {canvasRef.current
                    ? `${canvasRef.current.getNodes().length} node${canvasRef.current.getNodes().length !== 1 ? "s" : ""}, ${canvasRef.current.getEdges().length} connection${canvasRef.current.getEdges().length !== 1 ? "s" : ""}`
                    : "0 nodes, 0 connections"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => canvasRef.current?.autoLayout()}
                  className="gap-1.5 h-7 text-xs"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Auto Layout
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <WorkflowCanvasSection
                  ref={canvasRef}
                  initialNodes={initialNodes}
                  initialEdges={initialEdges}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            {/* Right Panel: Palette or Config */}
            <Card className="h-full overflow-hidden rounded-none border-0">
              {hasSelection ? (
                <NodeConfigPanel
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  getUpstreamOutputs={getUpstreamOutputs}
                  getAvailableDocuments={getAvailableDocuments}
                  getFieldDataFlow={getFieldDataFlowCallback}
                  onNodeDataChange={(data) => {
                    canvasRef.current?.updateNodeData(data);
                    setSelectedNode((prev) =>
                      prev ? { ...prev, data: { ...prev.data, ...data } } : null
                    );
                  }}
                  onNodeConfigChange={(config) => {
                    canvasRef.current?.updateNodeConfig(config);
                    setSelectedNode((prev) =>
                      prev
                        ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, ...config } } }
                        : null
                    );
                  }}
                  onEdgeDataChange={(data) => {
                    canvasRef.current?.updateEdgeData(data);
                    setSelectedEdge((prev) =>
                      prev ? { ...prev, data: { ...prev.data, ...data } as WorkflowRFEdge['data'] } : null
                    );
                  }}
                  onDeleteNode={(nodeId) => {
                    canvasRef.current?.deleteNode(nodeId);
                    setSelectedNodeId(null);
                  }}
                  onDeleteEdge={(edgeId) => {
                    canvasRef.current?.deleteEdge(edgeId);
                    setSelectedEdgeId(null);
                  }}
                />
              ) : (
                <NodePalette />
              )}
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
        </Card>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-end gap-3 shrink-0 px-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/admin/workstream-types")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveAsDraft}
          disabled={isSubmitting || persistence.isSaving}
        >
          {persistence.isSaving ? "Saving..." : isEditing ? "Save" : "Save as Draft"}
        </Button>
        <Button
          type="button"
          onClick={handleActivate}
          disabled={isSubmitting || persistence.isSaving}
        >
          Activate
        </Button>
      </div>
    </div>
  );
}
