import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRFNode, WorkflowRFEdge, WorkflowDAGState } from '../types';
import { dbNodeToRFNode, dbEdgeToRFEdge, rfNodeToDBNode, rfEdgeToDBEdge } from '../utils';

interface UseWorkflowPersistenceReturn {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadWorkflow: (workstreamTypeId: string) => Promise<WorkflowDAGState | null>;
  saveWorkflow: (
    workstreamTypeId: string,
    workstreamTypeName: string,
    nodes: WorkflowRFNode[],
    edges: WorkflowRFEdge[],
  ) => Promise<{ playbookId: string; playId: string } | null>;
}

export function useWorkflowPersistence(): UseWorkflowPersistenceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflow = useCallback(async (workstreamTypeId: string): Promise<WorkflowDAGState | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Find playbook for this workstream type
      const { data: playbook, error: pbError } = await supabase
        .from('playbooks')
        .select('*')
        .eq('workstream_type_id', workstreamTypeId)
        .eq('is_active', true)
        .maybeSingle();

      if (pbError) throw pbError;
      if (!playbook) return null;

      // Find play directly linked to playbook
      const { data: play, error: playError } = await supabase
        .from('playbook_plays')
        .select('*')
        .eq('playbook_id', playbook.id)
        .eq('is_active', true)
        .order('position')
        .maybeSingle();

      if (playError) throw playError;
      if (!play) return null;

      // Load nodes and edges
      const [nodesResult, edgesResult] = await Promise.all([
        supabase.from('workflow_nodes').select('*').eq('play_id', play.id),
        supabase.from('workflow_edges').select('*').eq('play_id', play.id),
      ]);

      if (nodesResult.error) throw nodesResult.error;
      if (edgesResult.error) throw edgesResult.error;

      const rfNodes = (nodesResult.data || []).map((row) => dbNodeToRFNode(row as any));
      const rfEdges = (edgesResult.data || []).map((row) => dbEdgeToRFEdge(row as any));

      return {
        playbookId: playbook.id,
        playId: play.id,
        nodes: rfNodes,
        edges: rfEdges,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workflow';
      setError(message);
      console.error('[WorkflowPersistence] Load error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveWorkflow = useCallback(
    async (
      workstreamTypeId: string,
      workstreamTypeName: string,
      nodes: WorkflowRFNode[],
      edges: WorkflowRFEdge[],
    ): Promise<{ playbookId: string; playId: string } | null> => {
      setIsSaving(true);
      setError(null);
      try {
        console.log('[WorkflowPersistence] Starting save for workstreamTypeId:', workstreamTypeId, 'nodes:', nodes.length, 'edges:', edges.length);

        // Step 1: Find or create playbook for this workstream type
        let { data: playbook, error: pbError } = await supabase
          .from('playbooks')
          .select('*')
          .eq('workstream_type_id', workstreamTypeId)
          .eq('is_active', true)
          .maybeSingle();

        if (pbError) throw new Error(`Find playbook failed: ${pbError.message}`);

        if (!playbook) {
          console.log('[WorkflowPersistence] Creating new playbook...');
          const { data: newPlaybook, error: createPbError } = await supabase
            .from('playbooks')
            .insert({
              name: `playbook_${workstreamTypeName.toLowerCase().replace(/\s+/g, '_')}`,
              display_name: `${workstreamTypeName} Playbook`,
              workstream_type_id: workstreamTypeId,
              is_active: true,
              is_template: false,
              version: 1,
              metadata: {},
            })
            .select()
            .single();

          if (createPbError) throw new Error(`Create playbook failed: ${createPbError.message}`);
          playbook = newPlaybook;
        }
        console.log('[WorkflowPersistence] Playbook ID:', playbook.id);

        // Step 2: Find or create play linked to playbook
        let { data: play, error: playError } = await supabase
          .from('playbook_plays')
          .select('*')
          .eq('playbook_id', playbook.id)
          .eq('is_active', true)
          .maybeSingle();

        if (playError) throw new Error(`Find play failed: ${playError.message}`);

        if (!play) {
          console.log('[WorkflowPersistence] Creating new play...');
          const { data: newPlay, error: createPlayError } = await supabase
            .from('playbook_plays')
            .insert({
              playbook_id: playbook.id,
              name: `play_${workstreamTypeName.toLowerCase().replace(/\s+/g, '_')}`,
              display_name: `${workstreamTypeName} Play`,
              is_active: true,
              position: 1,
              config: {},
              input_mapping: {},
              output_mapping: {},
              execution_conditions: {},
              metadata: {},
            })
            .select()
            .single();

          if (createPlayError) throw new Error(`Create play failed: ${createPlayError.message}`);
          play = newPlay;
        }

        const playId = play.id;
        console.log('[WorkflowPersistence] Play ID:', playId);

        // Step 3: Delete existing nodes and edges for this play
        const { error: delEdgesErr } = await supabase.from('workflow_edges').delete().eq('play_id', playId);
        if (delEdgesErr) console.warn('[WorkflowPersistence] Delete edges warning:', delEdgesErr.message);
        const { error: delNodesErr } = await supabase.from('workflow_nodes').delete().eq('play_id', playId);
        if (delNodesErr) console.warn('[WorkflowPersistence] Delete nodes warning:', delNodesErr.message);

        // Step 4: Insert new nodes
        if (nodes.length > 0) {
          const dbNodes = nodes.map((n) => {
            const dbNode = rfNodeToDBNode(n, playId);
            return {
              id: dbNode.id,
              play_id: dbNode.play_id,
              node_type: dbNode.node_type,
              brick_id: dbNode.brick_id,
              config: dbNode.config,
              position_x: Math.round(dbNode.position_x),
              position_y: Math.round(dbNode.position_y),
              metadata: dbNode.metadata,
            };
          });

          console.log('[WorkflowPersistence] Inserting nodes:', JSON.stringify(dbNodes, null, 2));
          const { error: insertNodesError } = await supabase
            .from('workflow_nodes')
            .insert(dbNodes);

          if (insertNodesError) throw new Error(`Insert nodes failed: ${insertNodesError.message}`);
          console.log('[WorkflowPersistence] Nodes inserted successfully');
        }

        // Step 5: Insert new edges
        if (edges.length > 0) {
          const dbEdges = edges.map((e) => {
            const dbEdge = rfEdgeToDBEdge(e, playId);
            return {
              id: dbEdge.id,
              play_id: dbEdge.play_id,
              source_node_id: dbEdge.source_node_id,
              target_node_id: dbEdge.target_node_id,
              edge_type: dbEdge.edge_type,
              condition: dbEdge.condition,
              label: dbEdge.label,
              metadata: dbEdge.metadata,
            };
          });

          console.log('[WorkflowPersistence] Inserting edges:', JSON.stringify(dbEdges, null, 2));
          const { error: insertEdgesError } = await supabase
            .from('workflow_edges')
            .insert(dbEdges);

          if (insertEdgesError) throw new Error(`Insert edges failed: ${insertEdgesError.message}`);
          console.log('[WorkflowPersistence] Edges inserted successfully');
        }

        console.log('[WorkflowPersistence] Save complete!');
        return { playbookId: playbook.id, playId };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save workflow';
        setError(message);
        console.error('[WorkflowPersistence] Save error:', err);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { isLoading, isSaving, error, loadWorkflow, saveWorkflow };
}
