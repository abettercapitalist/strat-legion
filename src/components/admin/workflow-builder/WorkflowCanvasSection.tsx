import { useCallback, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import type { BrickCategory } from '@/lib/bricks/types';
import type { WorkflowRFNode, WorkflowRFEdge } from './types';
import { useWorkflowDAG } from './hooks/useWorkflowDAG';
import { useAutoLayout } from './hooks/useAutoLayout';
import { useWorkflowValidation, type WorkflowValidationError } from './hooks/useWorkflowValidation';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';

export interface WorkflowCanvasSectionHandle {
  getNodes: () => WorkflowRFNode[];
  getEdges: () => WorkflowRFEdge[];
  setNodes: (nodes: WorkflowRFNode[]) => void;
  setEdges: (edges: WorkflowRFEdge[]) => void;
  validate: () => WorkflowValidationError[];
}

interface WorkflowCanvasSectionProps {
  initialNodes?: WorkflowRFNode[];
  initialEdges?: WorkflowRFEdge[];
}

const WorkflowCanvasSectionInner = forwardRef<WorkflowCanvasSectionHandle, WorkflowCanvasSectionProps>(
  function WorkflowCanvasSectionInner({ initialNodes = [], initialEdges = [] }, ref) {
    const dag = useWorkflowDAG(initialNodes, initialEdges);
    const { layoutNodes } = useAutoLayout();
    const { validate } = useWorkflowValidation();

    useImperativeHandle(ref, () => ({
      getNodes: () => dag.nodes,
      getEdges: () => dag.edges,
      setNodes: dag.setNodes,
      setEdges: dag.setEdges,
      validate: () => validate(dag.nodes, dag.edges),
    }), [dag.nodes, dag.edges, dag.setNodes, dag.setEdges, validate]);

    const handleDrop = useCallback(
      (category: BrickCategory, position: { x: number; y: number }) => {
        const newNode = dag.addNode(category, position);
        dag.setSelectedNodeId(newNode.id);
        dag.setSelectedEdgeId(null);
      },
      [dag]
    );

    const handleAutoLayout = useCallback(() => {
      const layouted = layoutNodes(dag.nodes, dag.edges);
      dag.setNodes(layouted);
    }, [dag, layoutNodes]);

    const selectedNode = dag.nodes.find((n) => n.id === dag.selectedNodeId) || null;
    const selectedEdge = dag.edges.find((e) => e.id === dag.selectedEdgeId) || null;

    return (
      <div className="h-[600px] border rounded-lg overflow-hidden bg-background">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Workflow Builder</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {dag.nodes.length} node{dag.nodes.length !== 1 ? 's' : ''}, {dag.edges.length} edge{dag.edges.length !== 1 ? 's' : ''}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoLayout}
              className="gap-1.5 h-7 text-xs"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Auto Layout
            </Button>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-41px)]">
          <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
            <NodePalette />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55} minSize={35}>
            <WorkflowCanvas
              nodes={dag.nodes}
              edges={dag.edges}
              onNodesChange={dag.onNodesChange}
              onEdgesChange={dag.onEdgesChange}
              onConnect={dag.onConnect}
              onNodeSelect={dag.setSelectedNodeId}
              onEdgeSelect={dag.setSelectedEdgeId}
              onDrop={handleDrop}
              onNodeDelete={dag.removeNode}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <NodeConfigPanel
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              onNodeDataChange={(data) => {
                if (dag.selectedNodeId) dag.updateNodeData(dag.selectedNodeId, data);
              }}
              onNodeConfigChange={(config) => {
                if (dag.selectedNodeId) dag.updateNodeConfig(dag.selectedNodeId, config);
              }}
              onEdgeDataChange={(data) => {
                if (dag.selectedEdgeId) dag.updateEdgeData(dag.selectedEdgeId, data);
              }}
              onDeleteNode={(nodeId) => dag.removeNode(nodeId)}
              onDeleteEdge={(edgeId) => dag.removeEdge(edgeId)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
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
