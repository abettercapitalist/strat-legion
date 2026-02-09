import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
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
import { useWorkflowPersistence } from "@/components/admin/workflow-builder/hooks/useWorkflowPersistence";
import { BasicInfoPanel, type BasicInfoFormData } from "@/components/designer/panels/BasicInfoPanel";

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
  team_category: z.string().min(1, "Assigned team is required"),
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

  // Selection state for right panel (palette vs config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // Bump to force re-render when config panel modifies node/edge data via ref
  const [, setConfigTick] = useState(0);
  const bumpConfigTick = useCallback(() => setConfigTick((t) => t + 1), []);

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

          // Load play approval config
          if (data.play_approval_config) {
            setPlayApprovalConfig(data.play_approval_config as unknown as PlayApprovalConfig);
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

    // Validate team category - check if a parent with sub-groups was selected
    const selectedTeam = teamCategory ? getTeamById(teamCategory) : null;
    if (selectedTeam && hasSubgroups(selectedTeam.id)) {
      errs.push({
        id: "team-subgroup",
        section: "basics",
        field: "team_category",
        message: "This team has sub-groups. Please select a specific group.",
      });
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
        play_approval_config: playApprovalConfig,
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

      if (isEditing && id) {
        if (status === "Active") {
          navigate("/admin/workstream-types");
        }
      } else {
        if (status === "Active") {
          navigate("/admin/workstream-types");
        } else if (workstreamTypeId) {
          navigate(`/admin/workstream-types/${workstreamTypeId}/edit`, { replace: true });
        }
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

  // Selection change callback from canvas
  const handleSelectionChange = useCallback(
    (nodeId: string | null, edgeId: string | null) => {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(edgeId);
    },
    []
  );

  // Derive selected node/edge objects for the config panel
  const selectedNode = canvasRef.current?.getSelectedNode() ?? null;
  const selectedEdge = canvasRef.current?.getSelectedEdge() ?? null;

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
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/workstream-types")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Play Library
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground">
            {displayNameValue || (isEditing ? "Edit Play" : "New Play")}
          </h1>
        </div>
        {/* Spacer to balance the layout */}
        <div className="w-[160px]" />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="px-4 pt-2 shrink-0">
          <ValidationSummaryPanel
            errors={validationErrors}
            onDismiss={() => setValidationErrors([])}
            onErrorClick={() => {}}
          />
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Basic Info */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
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
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel: Canvas */}
          <ResizablePanel defaultSize={55} minSize={35}>
            <div className="h-full flex flex-col">
              {/* Canvas toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {canvasRef.current
                    ? `${canvasRef.current.getNodes().length} node${canvasRef.current.getNodes().length !== 1 ? "s" : ""}, ${canvasRef.current.getEdges().length} edge${canvasRef.current.getEdges().length !== 1 ? "s" : ""}`
                    : "0 nodes, 0 edges"}
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
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: Palette or Config */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
            {hasSelection ? (
              <NodeConfigPanel
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                onNodeDataChange={(data) => {
                  canvasRef.current?.updateNodeData(data);
                  bumpConfigTick();
                }}
                onNodeConfigChange={(config) => {
                  canvasRef.current?.updateNodeConfig(config);
                  bumpConfigTick();
                }}
                onEdgeDataChange={(data) => {
                  canvasRef.current?.updateEdgeData(data);
                  bumpConfigTick();
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 border-t bg-background shrink-0">
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
          {persistence.isSaving ? "Saving..." : "Save as Draft"}
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
