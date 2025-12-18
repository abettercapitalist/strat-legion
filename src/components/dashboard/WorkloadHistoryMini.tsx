import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  userLoad: number;
  teamLoad: number;
}

interface WorkloadHistoryMiniProps {
  data: DataPoint[];
  title?: string;
  className?: string;
}

export function WorkloadHistoryMini({
  data,
  title = "30-Day Workload",
  className,
}: WorkloadHistoryMiniProps) {
  if (!data.length) {
    return (
      <div className={cn("flex flex-col", className)}>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="mt-2 flex h-16 items-center justify-center rounded-lg border bg-muted/50">
          <span className="text-sm text-muted-foreground">No data</span>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.userLoad, d.teamLoad]),
    100
  );

  // Normalize to 0-100 range for SVG
  const normalize = (value: number) => 100 - (value / maxValue) * 80;

  // Create SVG path from data points
  const createPath = (key: "userLoad" | "teamLoad") => {
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = normalize(d[key]);
      return `${x},${y}`;
    });
    return `M${points.join(" L")}`;
  };

  const userPath = createPath("userLoad");
  const teamPath = createPath("teamLoad");

  // Get latest values for display
  const latest = data[data.length - 1];

  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      
      <div className="relative mt-2 h-16 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Grid lines */}
          <line
            x1="0" y1="50" x2="100" y2="50"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          
          {/* Team line (behind) */}
          <path
            d={teamPath}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
          
          {/* User line (front) */}
          <path
            d={userPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-0.5 w-3 rounded bg-primary" />
            <span className="text-muted-foreground">You: {Math.round(latest?.userLoad || 0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-0.5 w-3 rounded bg-muted-foreground opacity-50" />
            <span className="text-muted-foreground">Team: {Math.round(latest?.teamLoad || 0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
