import { useCallback, useImperativeHandle, forwardRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { BrickCategory } from '@/lib/bricks/types';
import type { WorkflowRFNode, WorkflowRFEdge, WorkflowNodeData, WorkflowEdgeData } from './types';
import { useWorkflowDAG } from './hooks/useWorkflowDAG';
import { useAutoLayout } from './hooks/useAutoLayout';
import { useWorkflowValidation, type WorkflowValidationError } from './hooks/useWorkflowValidation';
import { WorkflowCanvas } from './WorkflowCanvas';

export interface WorkflowCanvasSectionHandle {
  getNodes: () => WorkflowRFNode[];
  getEdges: () => WorkflowRFEdge[];
  setNodes: (nodes: WorkflowRFNode[]) => void;
  setEdges: (edges: WorkflowRFEdge[]) => void;
  validate: () => WorkflowValidationError[];
  /** Current selection state for driving the right panel */
  getSelectedNodeId: () => string | null;
  getSelectedEdgeId: () => string | null;
  getSelectedNode: () => WorkflowRFNode | null;
  getSelectedEdge: () => WorkflowRFEdge | null;
  updateNodeData: (data: Partial<WorkflowNodeData>) => void;
  updateNodeConfig: (config: Record<string, unknown>) => void;
  updateEdgeData: (data: Partial<WorkflowEdgeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  autoLayout: () => void;
}

interface WorkflowCanvasSectionProps {
  initialNodes?: WorkflowRFNode[];
  initialEdges?: WorkflowRFEdge[];
  onSelectionChange?: (selectedNodeId: string | null, selectedEdgeId: string | null) => void;
}

const WorkflowCanvasSectionInner = forwardRef<WorkflowCanvasSectionHandle, WorkflowCanvasSectionProps>(
  function WorkflowCanvasSectionInner({ initialNodes = [], initialEdges = [], onSelectionChange }, ref) {
    const dag = useWorkflowDAG(initialNodes, initialEdges);
    const { layoutNodes } = useAutoLayout();
    const { validate } = useWorkflowValidation();

    const handleDrop = useCallback(
      (category: BrickCategory, position: { x: number; y: number }) => {
        dag.addNode(category, position);
      },
      [dag]
    );

    const handleNodeSelect = useCallback(
      (nodeId: string | null) => {
        dag.setSelectedNodeId(nodeId);
        dag.setSelectedEdgeId(null);
        onSelectionChange?.(nodeId, null);
      },
      [dag, onSelectionChange]
    );

    const handleEdgeSelect = useCallback(
      (edgeId: string | null) => {
        dag.setSelectedNodeId(null);
        dag.setSelectedEdgeId(edgeId);
        onSelectionChange?.(null, edgeId);
      },
      [dag, onSelectionChange]
    );

    const handleAutoLayout = useCallback(() => {
      const layouted = layoutNodes(dag.nodes, dag.edges);
      dag.setNodes(layouted);
    }, [dag, layoutNodes]);

    useImperativeHandle(ref, () => ({
      getNodes: () => dag.nodes,
      getEdges: () => dag.edges,
      setNodes: dag.setNodes,
      setEdges: dag.setEdges,
      validate: () => validate(dag.nodes, dag.edges),
      getSelectedNodeId: () => dag.selectedNodeId,
      getSelectedEdgeId: () => dag.selectedEdgeId,
      getSelectedNode: () => dag.nodes.find((n) => n.id === dag.selectedNodeId) || null,
      getSelectedEdge: () => dag.edges.find((e) => e.id === dag.selectedEdgeId) || null,
      updateNodeData: (data) => {
        if (dag.selectedNodeId) dag.updateNodeData(dag.selectedNodeId, data);
      },
      updateNodeConfig: (config) => {
        if (dag.selectedNodeId) dag.updateNodeConfig(dag.selectedNodeId, config);
      },
      updateEdgeData: (data) => {
        if (dag.selectedEdgeId) dag.updateEdgeData(dag.selectedEdgeId, data);
      },
      deleteNode: (nodeId) => dag.removeNode(nodeId),
      deleteEdge: (edgeId) => dag.removeEdge(edgeId),
      autoLayout: handleAutoLayout,
    }), [dag, validate, handleAutoLayout]);

    return (
      <WorkflowCanvas
        nodes={dag.nodes}
        edges={dag.edges}
        onNodesChange={dag.onNodesChange}
        onEdgesChange={dag.onEdgesChange}
        onConnect={dag.onConnect}
        onNodeSelect={handleNodeSelect}
        onEdgeSelect={handleEdgeSelect}
        onDrop={handleDrop}
        onNodeDelete={dag.removeNode}
        onEdgeDelete={dag.removeEdge}
        onSetEdges={dag.setEdges}
      />
    );
  }
);

export const WorkflowCanvasSection = forwardRef<WorkflowCanvasSectionHandle, WorkflowCanvasSectionProps>(
  function WorkflowCanvasSection(props, ref) {
    return (
      <ReactFlowProvider>
        <WorkflowCanvasSectionInner ref={ref} {...props} />
      </ReactFlowProvider>
    );
  }
);
