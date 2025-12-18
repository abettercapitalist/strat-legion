import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";

interface SummaryCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    direction: TrendDirection;
  };
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

function getTrendColor(direction: TrendDirection): string {
  switch (direction) {
    case "up":
      return "text-status-success";
    case "down":
      return "text-status-error";
    default:
      return "text-muted-foreground";
  }
}

function getTrendArrow(direction: TrendDirection): string {
  switch (direction) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    default:
      return "";
  }
}

export function SummaryCard({
  title,
  value,
  trend,
  icon: Icon,
  onClick,
  className,
}: SummaryCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors",
        onClick && "hover:bg-accent cursor-pointer",
        className
      )}
    >
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {trend && (
            <span className={cn("text-sm font-medium", getTrendColor(trend.direction))}>
              {getTrendArrow(trend.direction)} {trend.value}
            </span>
          )}
        </div>
      </div>
    </Component>
  );
}
