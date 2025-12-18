import { cn } from "@/lib/utils";

interface MetricRingProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { ring: 64, stroke: 6, fontSize: "text-lg", labelSize: "text-xs" },
  md: { ring: 96, stroke: 8, fontSize: "text-2xl", labelSize: "text-sm" },
  lg: { ring: 128, stroke: 10, fontSize: "text-3xl", labelSize: "text-base" },
};

function getStatusColor(percentage: number): string {
  if (percentage >= 70) return "hsl(var(--status-success))";
  if (percentage >= 40) return "hsl(var(--status-warning))";
  return "hsl(var(--status-error))";
}

export function MetricRing({
  value,
  max = 100,
  label,
  sublabel,
  size = "md",
  showValue = true,
  className,
}: MetricRingProps) {
  const config = sizeConfig[size];
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = getStatusColor(percentage);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.ring}
          height={config.ring}
        >
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={config.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("font-bold tabular-nums", config.fontSize)}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      <span className={cn("mt-2 font-medium text-foreground", config.labelSize)}>
        {label}
      </span>
      {sublabel && (
        <span className={cn("text-muted-foreground", config.labelSize)}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
