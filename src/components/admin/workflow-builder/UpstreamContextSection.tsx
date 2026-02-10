import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { UpstreamOutput } from './outputSchemas';
import { BRICK_COLORS } from './utils';

interface UpstreamContextSectionProps {
  upstreamOutputs: UpstreamOutput[];
}

export function UpstreamContextSection({ upstreamOutputs }: UpstreamContextSectionProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (upstreamOutputs.length === 0) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Receives From
        </p>
        <p className="text-xs text-muted-foreground italic">
          Entry node — no upstream data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Receives From
      </p>
      <div className="space-y-1.5">
        {upstreamOutputs.map((upstream) => {
          const colors = BRICK_COLORS[upstream.brickCategory];
          const isExpanded = expandedNodes.has(upstream.nodeId);

          return (
            <div
              key={upstream.nodeId}
              className="border rounded-md overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleNode(upstream.nodeId)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.badge}`}>
                  {upstream.brickCategory}
                </span>
                <span className="text-xs font-medium truncate">
                  {upstream.nodeLabel}
                </span>
              </button>
              {isExpanded && upstream.fields.length > 0 && (
                <div className="px-3 pb-2 pt-0.5 space-y-0.5">
                  {upstream.fields.map((field) => (
                    <div key={field.name} className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {field.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {field.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
