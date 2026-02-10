import { useCallback, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  type NodeTypes,
  type EdgeTypes,
  type Edge,
  type Connection,
  type Node,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { WorkflowRFNode, WorkflowRFEdge } from './types';
import type { BrickCategory } from '@/lib/bricks/types';
import { BrickNode } from './BrickNode';
import { ConditionalEdge } from './edges/ConditionalEdge';
import { BRICK_COLORS, getOptimalHandles } from './utils';

const nodeTypes: NodeTypes = {
  brick: BrickNode,
};

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

interface WorkflowCanvasProps {
  nodes: WorkflowRFNode[];
  edges: WorkflowRFEdge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  onDrop: (category: BrickCategory, position: { x: number; y: number }) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeDelete: (edgeId: string) => void;
  onSetEdges: React.Dispatch<React.SetStateAction<WorkflowRFEdge[]>>;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onEdgeSelect,
  onDrop,
  onNodeDelete,
  onEdgeDelete,
  onSetEdges,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const category = e.dataTransfer.getData('application/workflow-brick') as BrickCategory;
      if (!category) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      onDrop(category, position);
    },
    [screenToFlowPosition, onDrop]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: WorkflowRFNode) => {
      onEdgeSelect(null);
      onNodeSelect(node.id);
    },
    [onNodeSelect, onEdgeSelect]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: WorkflowRFEdge) => {
      onNodeSelect(null);
      onEdgeSelect(edge.id);
    },
    [onNodeSelect, onEdgeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
    onEdgeSelect(null);
  }, [onNodeSelect, onEdgeSelect]);

  // Reconnect an existing edge when dragged to a new handle
  const edgeReconnectSuccessful = useRef(true);

  const handleReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      // Manually update the edge instead of using reconnectEdge(),
      // which generates a non-UUID "xy-edge__..." ID that breaks DB saves.
      onSetEdges((eds) =>
        eds.map((e) =>
          e.id === oldEdge.id
            ? {
                ...e,
                source: newConnection.source!,
                target: newConnection.target!,
                sourceHandle: newConnection.sourceHandle ?? undefined,
                targetHandle: newConnection.targetHandle ?? undefined,
              }
            : e
        )
      );
    },
    [onSetEdges]
  );

  const handleReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        // Edge was dropped in empty space — remove it
        onSetEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [onSetEdges]
  );

  // When a node stops moving, re-optimize handle assignments for connected edges
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      onSetEdges((eds) => {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        // Use the dragged node's latest position (from the event, not stale state)
        nodeMap.set(draggedNode.id, draggedNode as WorkflowRFNode);

        return eds.map((edge) => {
          // Only re-optimize edges connected to the dragged node
          if (edge.source !== draggedNode.id && edge.target !== draggedNode.id) return edge;

          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          if (!sourceNode || !targetNode) return edge;

          const { sourceHandle, targetHandle } = getOptimalHandles(
            sourceNode.position,
            targetNode.position,
          );

          if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) {
            return edge;
          }

          return { ...edge, sourceHandle, targetHandle };
        });
      });
    },
    [nodes, onSetEdges]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNode = nodes.find((n) => n.selected);
        if (selectedNode) {
          onNodeDelete(selectedNode.id);
          return;
        }
        const selectedEdge = edges.find((ed) => ed.selected);
        if (selectedEdge) {
          onEdgeDelete(selectedEdge.id);
          return;
        }
      }
      if (e.key === 'Escape') {
        onNodeSelect(null);
        onEdgeSelect(null);
      }
    },
    [nodes, edges, onNodeDelete, onEdgeDelete, onNodeSelect, onEdgeSelect]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <ReactFlow<WorkflowRFNode, WorkflowRFEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={handleReconnect}
        onReconnectStart={handleReconnectStart}
        onReconnectEnd={handleReconnectEnd}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode="loose"
        connectionLineType={ConnectionLineType.SmoothStep}
        edgesReconnectable
        fitView
        deleteKeyCode={null}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          reconnectable: true,
          interactionWidth: 30,
        }}
        connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
      >
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const data = node.data as WorkflowRFNode['data'];
            const category = data?.brickCategory;
            if (category === 'collection') return '#93c5fd';
            if (category === 'review') return '#fcd34d';
            if (category === 'approval') return '#86efac';
            if (category === 'documentation') return '#c4b5fd';
            if (category === 'commitment') return '#fda4af';
            return '#cbd5e1';
          }}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-background/80 !border !border-border !rounded-lg"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}
