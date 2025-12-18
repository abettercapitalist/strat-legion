import { cn } from "@/lib/utils";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface VisualBreakdownProps {
  segments: Segment[];
  showLegend?: boolean;
  showValues?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { height: "h-2", gap: "gap-1", legendText: "text-xs" },
  md: { height: "h-3", gap: "gap-2", legendText: "text-sm" },
  lg: { height: "h-4", gap: "gap-3", legendText: "text-base" },
};

export function VisualBreakdown({
  segments,
  showLegend = true,
  showValues = true,
  size = "md",
  className,
}: VisualBreakdownProps) {
  const config = sizeConfig[size];
  const total = segments.reduce((acc, seg) => acc + seg.value, 0);

  if (total === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className={cn("w-full rounded-full bg-muted", config.height)} />
        <p className="mt-2 text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Stacked bar */}
      <div className={cn("flex w-full overflow-hidden rounded-full", config.height)}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          if (percentage === 0) return null;
          return (
            <div
              key={index}
              className="transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
              }}
              title={`${segment.label}: ${segment.value} (${Math.round(percentage)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className={cn("mt-3 flex flex-wrap", config.gap)}>
          {segments.map((segment, index) => {
            const percentage = (segment.value / total) * 100;
            if (percentage === 0) return null;
            return (
              <div key={index} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className={cn("text-muted-foreground", config.legendText)}>
                  {segment.label}
                  {showValues && (
                    <span className="ml-1 tabular-nums">
                      ({segment.value})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
