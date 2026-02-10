import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ClipboardList, Search, CheckCircle, FileText, PenTool, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from './types';
import type { BrickCategory } from '@/lib/bricks/types';
import { BRICK_COLORS } from './utils';

const ICONS: Record<BrickCategory, React.ComponentType<{ className?: string }>> = {
  collection: ClipboardList,
  review: Search,
  approval: CheckCircle,
  documentation: FileText,
  commitment: PenTool,
};

function BrickNodeComponent({ data, selected }: NodeProps<WorkflowNodeData>) {
  const colors = BRICK_COLORS[data.brickCategory];
  const Icon = ICONS[data.brickCategory];

  return (
    <div
      style={{ '--brick-glow': colors.glow } as React.CSSProperties}
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-sm min-w-[180px] max-w-[220px] transition-shadow',
        colors.bg,
        colors.border,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-md',
        !data.isValid && 'border-destructive'
      )}
    >
      {/* One handle per side — connectionMode="loose" on ReactFlow allows any-to-any */}
      <Handle type="source" id="top" position={Position.Top} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" />
      <Handle type="source" id="right" position={Position.Right} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" />
      <Handle type="source" id="left" position={Position.Left} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white" />

      <div className="flex items-start gap-2">
        <div className={cn('p-1.5 rounded-md flex-shrink-0', colors.badge)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('text-xs font-medium uppercase tracking-wider mb-0.5', colors.text)}>
            {data.brickCategory}
          </div>
          <div className="text-sm font-semibold text-foreground truncate">
            {data.label}
          </div>
        </div>
        {!data.isValid && (
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
        )}
      </div>

      {data.validationErrors.length > 0 && (
        <div className="mt-2 text-xs text-destructive">
          {data.validationErrors[0]}
        </div>
      )}
    </div>
  );
}

export const BrickNode = memo(BrickNodeComponent);
