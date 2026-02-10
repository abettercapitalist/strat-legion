import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Link2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WorkflowRFNode, WorkflowRFEdge, WorkflowNodeData, WorkflowEdgeData } from './types';
import type { UpstreamOutput } from './outputSchemas';
import { CollectionBrickForm } from './forms/CollectionBrickForm';
import { ReviewBrickForm } from './forms/ReviewBrickForm';
import { ApprovalBrickForm } from './forms/ApprovalBrickForm';
import { DocumentationBrickForm } from './forms/DocumentationBrickForm';
import { CommitmentBrickForm } from './forms/CommitmentBrickForm';
import { EdgeConditionForm } from './forms/EdgeConditionForm';
import { UpstreamContextSection } from './UpstreamContextSection';
import { BRICK_COLORS, BRICK_LABELS } from './utils';

interface NodeConfigPanelProps {
  selectedNode: WorkflowRFNode | null;
  selectedEdge: WorkflowRFEdge | null;
  onNodeDataChange: (data: Partial<WorkflowNodeData>) => void;
  onNodeConfigChange: (config: Record<string, unknown>) => void;
  onEdgeDataChange: (data: Partial<WorkflowEdgeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  getUpstreamOutputs?: (nodeId: string) => UpstreamOutput[];
}

export function NodeConfigPanel({
  selectedNode,
  selectedEdge,
  onNodeDataChange,
  onNodeConfigChange,
  onEdgeDataChange,
  onDeleteNode,
  onDeleteEdge,
  getUpstreamOutputs,
}: NodeConfigPanelProps) {
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Select a node or connection to configure</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag bricks from the palette to add them to the canvas
          </p>
        </div>
      </div>
    );
  }

  // Edge selected
  if (selectedEdge && selectedEdge.data) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Connection Configuration</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <EdgeConditionForm
            edgeData={selectedEdge.data}
            onEdgeDataChange={onEdgeDataChange}
          />
        </div>
      </ScrollArea>
    );
  }

  // Node selected
  if (selectedNode) {
    const category = selectedNode.data.brickCategory;
    const colors = BRICK_COLORS[category];
    const upstreamOutputs = getUpstreamOutputs?.(selectedNode.id) ?? [];

    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
                {category}
              </span>
              <h3 className="text-sm font-semibold">{selectedNode.data.label}</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDeleteNode(selectedNode.id)}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Upstream context */}
          <UpstreamContextSection upstreamOutputs={upstreamOutputs} />

          {/* Label */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Label</Label>
            <Input
              value={selectedNode.data.label}
              onChange={(e) => onNodeDataChange({ label: e.target.value })}
              placeholder={BRICK_LABELS[category]}
              className="h-8"
            />
          </div>

          {/* Brick-specific form */}
          <div className="border-t pt-4">
            {category === 'collection' && (
              <CollectionBrickForm config={selectedNode.data.config} onConfigChange={onNodeConfigChange} upstreamOutputs={upstreamOutputs} />
            )}
            {category === 'review' && (
              <ReviewBrickForm config={selectedNode.data.config} onConfigChange={onNodeConfigChange} upstreamOutputs={upstreamOutputs} />
            )}
            {category === 'approval' && (
              <ApprovalBrickForm config={selectedNode.data.config} onConfigChange={onNodeConfigChange} upstreamOutputs={upstreamOutputs} />
            )}
            {category === 'documentation' && (
              <DocumentationBrickForm config={selectedNode.data.config} onConfigChange={onNodeConfigChange} upstreamOutputs={upstreamOutputs} />
            )}
            {category === 'commitment' && (
              <CommitmentBrickForm config={selectedNode.data.config} onConfigChange={onNodeConfigChange} upstreamOutputs={upstreamOutputs} />
            )}
          </div>
        </div>
      </ScrollArea>
    );
  }

  return null;
}
