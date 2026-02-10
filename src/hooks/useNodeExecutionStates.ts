import { useQuery } from '@tanstack/react-query';
import { loadNodeExecutionStates } from '@/lib/bricks/services/supabase';
import type { NodeExecutionState } from '@/lib/bricks/types';

export function useNodeExecutionStates(workstreamId: string | undefined, playId: string | undefined) {
  return useQuery<NodeExecutionState[]>({
    queryKey: ['node-execution-state', workstreamId, playId],
    queryFn: () => loadNodeExecutionStates(workstreamId!, playId!),
    enabled: !!workstreamId && !!playId,
    refetchInterval: 10_000,
  });
}
