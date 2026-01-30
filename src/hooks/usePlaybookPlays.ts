import { useQuery } from "@tanstack/react-query";
import {
  loadPlaybookByWorkstreamType,
  loadPlaybookPatterns,
  loadPlaybookPlays,
} from "@/lib/bricks/services/supabase";
import type { Playbook, PlaybookPattern, PlaybookPlay } from "@/lib/bricks/types";

export interface UsePlaybookPlaysReturn {
  playbook: Playbook | null | undefined;
  patterns: PlaybookPattern[];
  playsByPattern: Map<string, PlaybookPlay[]>;
  isLoading: boolean;
  error: Error | null;
}

export function usePlaybookPlays(workstreamTypeId: string | null): UsePlaybookPlaysReturn {
  // 1. Load playbook for this workstream type
  const {
    data: playbook,
    isLoading: isLoadingPlaybook,
    error: playbookError,
  } = useQuery({
    queryKey: ["playbook-by-type", workstreamTypeId],
    queryFn: () => loadPlaybookByWorkstreamType(workstreamTypeId!),
    enabled: !!workstreamTypeId,
  });

  const playbookId = playbook?.id ?? null;

  // 2. Load patterns for the playbook
  const {
    data: patterns = [],
    isLoading: isLoadingPatterns,
    error: patternsError,
  } = useQuery({
    queryKey: ["playbook-patterns", playbookId],
    queryFn: () => loadPlaybookPatterns(playbookId!),
    enabled: !!playbookId,
  });

  // 3. Load plays for each pattern
  const patternIds = patterns.map((p) => p.id);
  const {
    data: playsByPattern = new Map<string, PlaybookPlay[]>(),
    isLoading: isLoadingPlays,
    error: playsError,
  } = useQuery({
    queryKey: ["playbook-plays-by-pattern", patternIds],
    queryFn: async () => {
      const map = new Map<string, PlaybookPlay[]>();
      const results = await Promise.all(
        patterns.map((pattern) => loadPlaybookPlays(pattern.id))
      );
      patterns.forEach((pattern, idx) => {
        map.set(pattern.id, results[idx]);
      });
      return map;
    },
    enabled: patternIds.length > 0,
  });

  const isLoading = isLoadingPlaybook || isLoadingPatterns || isLoadingPlays;
  const error = playbookError ?? patternsError ?? playsError ?? null;

  return {
    playbook,
    patterns,
    playsByPattern,
    isLoading,
    error: error as Error | null,
  };
}
