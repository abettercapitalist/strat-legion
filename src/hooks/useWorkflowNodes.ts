import { useQuery } from '@tanstack/react-query';
import { loadWorkflowNodes, loadWorkflowEdges } from '@/lib/bricks/services/supabase';
import type { WorkflowNode, WorkflowEdge } from '@/lib/bricks/types';

interface WorkflowDAGData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function useWorkflowNodes(playId: string | undefined) {
  return useQuery<WorkflowDAGData>({
    queryKey: ['workflow-nodes', playId],
    queryFn: async () => {
      const [nodes, edges] = await Promise.all([
        loadWorkflowNodes(playId!),
        loadWorkflowEdges(playId!),
      ]);
      return { nodes, edges };
    },
    enabled: !!playId,
  });
}
