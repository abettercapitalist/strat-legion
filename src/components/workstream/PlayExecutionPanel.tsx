import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, Clock, Circle, AlertCircle, ShieldAlert } from 'lucide-react';
import { useWorkflowNodes } from '@/hooks/useWorkflowNodes';
import { useNodeExecutionStates } from '@/hooks/useNodeExecutionStates';
import { usePlayExecution } from '@/hooks/usePlayExecution';
import { useAuth } from '@/contexts/AuthContext';
import { PendingActionRenderer } from './brick-forms/PendingActionRenderer';
import { BRICK_CATEGORY_NAMES } from '@/lib/bricks/types';
import { BRICK_COLORS, BRICK_LABELS } from '@/components/admin/workflow-builder/utils';
import type { BrickCategory, WorkflowNode, WorkflowEdge, NodeExecutionState } from '@/lib/bricks/types';
import type { Workstream, CurrentUser } from '@/lib/bricks/services/playExecutor';

interface PlayExecutionPanelProps {
  workstreamId: string;
  playId: string;
  playbookId: string | null;
  currentNodeIds: string[];
  workstream: Workstream;
  user: CurrentUser | null;
}

interface OrderedNode {
  node: WorkflowNode;
  category: BrickCategory;
  label: string;
  state: NodeExecutionState | undefined;
}

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const nodeMap = new Map<string, WorkflowNode>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
    nodeMap.set(n.id, n);
  }
  for (const e of edges) {
    adj.get(e.source_node_id)?.push(e.target_node_id);
    inDegree.set(e.target_node_id, (inDegree.get(e.target_node_id) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: WorkflowNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);
    for (const next of adj.get(id) || []) {
      const newDeg = (inDegree.get(next) || 1) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  return sorted;
}

function getStatusIcon(status: string | undefined) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'running':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'waiting':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
}

function getOverallStatus(orderedNodes: OrderedNode[]): string {
  if (orderedNodes.length === 0) return 'empty';
  const statuses = orderedNodes.map(n => n.state?.status);
  if (statuses.every(s => s === 'completed')) return 'completed';
  if (statuses.some(s => s === 'waiting')) return 'waiting';
  if (statuses.some(s => s === 'running')) return 'in_progress';
  if (statuses.some(s => s === 'completed') || statuses.some(s => s === 'failed')) return 'in_progress';
  return 'not_started';
}

export function PlayExecutionPanel({
  workstreamId,
  playId,
  playbookId,
  currentNodeIds,
  workstream,
  user,
}: PlayExecutionPanelProps) {
  const { user: authUser, customRoles, getWorkRoutingRoleIds } = useAuth();
  const { data: dagData, isLoading: nodesLoading } = useWorkflowNodes(playId);
  const { data: execStates = [] } = useNodeExecutionStates(workstreamId, playId);
  const { executePlay: runPlay, resumePlay, isExecuting } = usePlayExecution();

  const currentUserRoleIds = useMemo(
    () => customRoles.map((r) => r.id),
    [customRoles],
  );

  const stateMap = useMemo(
    () => new Map(execStates.map(s => [s.node_id, s])),
    [execStates],
  );

  const orderedNodes: OrderedNode[] = useMemo(() => {
    if (!dagData) return [];
    const sorted = topologicalSort(dagData.nodes, dagData.edges);
    // Only include brick nodes (skip start/end/fork/join/decision control nodes)
    return sorted
      .filter(n => n.node_type === 'brick')
      .map(n => {
        const category = n.brick_id ? BRICK_CATEGORY_NAMES[n.brick_id] : undefined;
        return {
          node: n,
          category: category || 'collection',
          label: (n.metadata as Record<string, string>)?.label || (category ? BRICK_LABELS[category] : 'Step'),
          state: stateMap.get(n.id),
        };
      });
  }, [dagData, stateMap]);

  const overallStatus = getOverallStatus(orderedNodes);

  // The first node whose state is 'waiting' is the active node
  const activeNode = orderedNodes.find(n => n.state?.status === 'waiting');

  const handleStartPlay = async () => {
    await runPlay(workstream, playId, user);
  };

  const handleSubmitAction = async (data: Record<string, unknown>) => {
    await resumePlay(workstream, playId, user, data);
  };

  if (nodesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Play Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded-lg" />
            <div className="h-12 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orderedNodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Play Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No workflow nodes found for this play.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Play Execution</CardTitle>
          <Badge variant="outline" className="capitalize">
            {overallStatus.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Horizontal node chain */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {orderedNodes.map((on, i) => {
            const colors = BRICK_COLORS[on.category];
            const isActive = activeNode?.node.id === on.node.id;
            return (
              <div key={on.node.id} className="flex items-center shrink-0">
                {i > 0 && (
                  <div className="w-6 h-px bg-border mx-1" />
                )}
                <div
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                    ${isActive ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-${on.category === 'collection' ? 'blue' : on.category === 'review' ? 'amber' : on.category === 'approval' ? 'green' : on.category === 'documentation' ? 'purple' : 'rose'}-300` : ''}
                    ${on.state?.status === 'completed' ? 'bg-muted/40 border-muted' : !on.state?.status ? 'bg-card border-muted opacity-50' : `${colors.bg} ${colors.border}`}
                  `}
                >
                  {getStatusIcon(on.state?.status)}
                  <div>
                    <div className="font-medium whitespace-nowrap">{on.label}</div>
                    <Badge className={`${colors.badge} text-[10px] px-1.5 py-0`}>
                      {BRICK_LABELS[on.category]}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Play button */}
        {overallStatus === 'not_started' && (
          <Button onClick={handleStartPlay} disabled={isExecuting} className="w-full">
            {isExecuting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Starting...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />Start Play</>
            )}
          </Button>
        )}

        {/* Pending action form for active node */}
        {activeNode && (() => {
          // Prefer runtime pending_action.config from execution state metadata
          // over raw node.config (static designer config)
          const stateMetadata = (activeNode.state?.metadata || {}) as Record<string, unknown>;
          const pendingConfig = (stateMetadata.config as Record<string, unknown>) || {};
          const mergedConfig = { ...(activeNode.node.config || {}), ...pendingConfig };

          // Visibility gate: check if current user can act on this brick
          const currentUserId = authUser?.id;
          const assignedUserId = stateMetadata.assigned_user_id as string | null;
          const assignedRoleId = stateMetadata.assigned_role_id as string | null;

          const canAct = !assignedUserId
            || assignedUserId === currentUserId
            || (assignedRoleId != null && currentUserRoleIds.includes(assignedRoleId));

          if (!canAct) {
            return (
              <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm text-muted-foreground">
                    Waiting on another team member
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This step is assigned to {assignedUserId ? 'a specific user' : 'a specific role'}.
                  You&apos;ll be able to act once it&apos;s reassigned or completed.
                </p>
              </div>
            );
          }

          return (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Action Required: {activeNode.label}</span>
              </div>
              <PendingActionRenderer
                category={activeNode.category}
                config={mergedConfig}
                onSubmit={handleSubmitAction}
                isSubmitting={isExecuting}
              />
            </div>
          );
        })()}

        {/* Completed message */}
        {overallStatus === 'completed' && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Play Complete</p>
              <p className="text-sm text-green-600 dark:text-green-300">
                All workflow steps have been completed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
