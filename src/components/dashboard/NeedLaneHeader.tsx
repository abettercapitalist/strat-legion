import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NeedLaneHeaderProps {
  title: string;
  count: number;
  maxExpected?: number;
  overdueCount?: number;
  icon: LucideIcon;
  className?: string;
}

function getHealthColor(count: number, overdueCount: number, maxExpected: number): string {
  const overduePercentage = count > 0 ? (overdueCount / count) * 100 : 0;
  
  if (overduePercentage > 20 || count > maxExpected * 1.5) {
    return "hsl(var(--destructive))";
  }
  if (overduePercentage > 0 || count > maxExpected) {
    return "hsl(45 100% 50%)"; // amber
  }
  return "hsl(142 70% 45%)"; // green
}

export function NeedLaneHeader({
  title,
  count,
  maxExpected = 6,
  overdueCount = 0,
  icon: Icon,
  className,
}: NeedLaneHeaderProps) {
  const healthColor = getHealthColor(count, overdueCount, maxExpected);
  const percentage = Math.min(100, (count / maxExpected) * 100);
  
  // SVG ring dimensions
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      {/* Metric Ring */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={healthColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{
              filter: overdueCount > 0 ? `drop-shadow(0 0 6px ${healthColor})` : undefined,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-lg font-bold" 
            style={{ color: healthColor }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Title and icon */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {overdueCount > 0 && (
          <p className="text-xs text-destructive font-medium mt-0.5">
            {overdueCount} overdue
          </p>
        )}
      </div>
    </div>
  );
}
