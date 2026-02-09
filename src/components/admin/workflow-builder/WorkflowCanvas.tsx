import { useCallback, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { WorkflowRFNode, WorkflowRFEdge } from './types';
import type { BrickCategory } from '@/lib/bricks/types';
import { BrickNode } from './BrickNode';
import { ConditionalEdge } from './edges/ConditionalEdge';
import { BRICK_COLORS } from './utils';

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = nodes.find((n) => n.selected);
        if (selected) {
          onNodeDelete(selected.id);
        }
      }
    },
    [nodes, onNodeDelete]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <ReactFlow<WorkflowRFNode, WorkflowRFEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={null}
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
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
