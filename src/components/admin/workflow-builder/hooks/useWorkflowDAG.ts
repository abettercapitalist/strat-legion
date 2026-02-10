import { useCallback, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
} from '@xyflow/react';
import type { WorkflowRFNode, WorkflowRFEdge, WorkflowNodeData, WorkflowEdgeData } from '../types';
import type { BrickCategory, WorkflowEdgeType } from '@/lib/bricks/types';
import { createNodeFromDrop, createEdgeFromConnection, getEdgeStyle, generateEdgeId } from '../utils';

interface UseWorkflowDAGReturn {
  nodes: WorkflowRFNode[];
  edges: WorkflowRFEdge[];
  onNodesChange: OnNodesChange<WorkflowRFNode>;
  onEdgesChange: OnEdgesChange<WorkflowRFEdge>;
  onConnect: OnConnect;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  addNode: (category: BrickCategory, position: { x: number; y: number }) => WorkflowRFNode;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  removeEdge: (edgeId: string) => void;
  updateEdgeData: (edgeId: string, data: Partial<WorkflowEdgeData>) => void;
  setNodes: React.Dispatch<React.SetStateAction<WorkflowRFNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<WorkflowRFEdge[]>>;
  clearSelection: () => void;
}

export function useWorkflowDAG(
  initialNodes: WorkflowRFNode[] = [],
  initialEdges: WorkflowRFEdge[] = [],
): UseWorkflowDAGReturn {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowRFNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowRFEdge>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      // Prevent self-loops
      if (connection.source === connection.target) return;
      // Prevent duplicate edges
      const exists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) return;

      const newEdge = createEdgeFromConnection(
        connection.source,
        connection.target,
        'default',
        connection.sourceHandle ?? undefined,
        connection.targetHandle ?? undefined,
      );
      setEdges((eds) => [...eds, newEdge]);
    },
    [edges, setEdges]
  );

  const addNode = useCallback(
    (category: BrickCategory, position: { x: number; y: number }) => {
      const newNode = createNodeFromDrop(category, position);
      setNodes((nds) => [...nds, newNode]);
      return newNode;
    },
    [setNodes]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [setNodes, setEdges, selectedNodeId]
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        )
      );
    },
    [setNodes]
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
            : n
        )
      );
    },
    [setNodes]
  );

  const removeEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
    },
    [setEdges, selectedEdgeId]
  );

  const updateEdgeData = useCallback(
    (edgeId: string, data: Partial<WorkflowEdgeData>) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          const newData = { ...e.data, ...data } as WorkflowEdgeData;
          const style = getEdgeStyle(newData.edgeType);
          return {
            ...e,
            data: newData,
            type: newData.edgeType === 'conditional' ? 'conditional' : 'default',
            animated: newData.edgeType === 'conditional',
            style,
          };
        })
      );
    },
    [setEdges]
  );

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedEdgeId,
    addNode,
    removeNode,
    updateNodeData,
    updateNodeConfig,
    removeEdge,
    updateEdgeData,
    setNodes,
    setEdges,
    clearSelection,
  };
}
