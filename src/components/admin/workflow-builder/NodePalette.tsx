import { type DragEvent } from 'react';
import { ClipboardList, Search, CheckCircle, FileText, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrickCategory } from '@/lib/bricks/types';
import { BRICK_COLORS, BRICK_LABELS, BRICK_DESCRIPTIONS } from './utils';

const ICONS: Record<BrickCategory, React.ComponentType<{ className?: string }>> = {
  collection: ClipboardList,
  review: Search,
  approval: CheckCircle,
  documentation: FileText,
  commitment: PenTool,
};

const CATEGORIES: BrickCategory[] = ['collection', 'review', 'approval', 'documentation', 'commitment'];

function PaletteItem({ category }: { category: BrickCategory }) {
  const colors = BRICK_COLORS[category];
  const Icon = ICONS[category];

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/workflow-brick', category);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-grab active:cursor-grabbing transition-colors hover:shadow-sm',
        colors.bg,
        colors.border,
      )}
    >
      <div className={cn('p-1 rounded', colors.badge)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{BRICK_LABELS[category]}</div>
        <div className="text-xs text-muted-foreground truncate">{BRICK_DESCRIPTIONS[category]}</div>
      </div>
    </div>
  );
}

export function NodePalette() {
  return (
    <div className="h-full flex flex-col p-3 bg-background overflow-y-auto">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Bricks
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag onto canvas
        </p>
      </div>

      <div className="space-y-2">
        {CATEGORIES.map((category) => (
          <PaletteItem key={category} category={category} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Patterns
        </h3>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Coming soon — reusable sub-graphs
        </p>
      </div>
    </div>
  );
}
