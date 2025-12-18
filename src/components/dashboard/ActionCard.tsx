import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type Urgency = "low" | "medium" | "high" | "critical";

interface ActionCardProps {
  title: string;
  subtitle?: string;
  urgency?: Urgency;
  actionLabel?: string;
  onAction?: () => void;
  metadata?: string;
  className?: string;
}

function getUrgencyStyles(urgency: Urgency) {
  switch (urgency) {
    case "critical":
      return {
        border: "border-l-4 border-l-status-error",
        badge: "bg-status-error/10 text-status-error",
        label: "Urgent",
      };
    case "high":
      return {
        border: "border-l-4 border-l-status-warning",
        badge: "bg-status-warning/10 text-status-warning",
        label: "High",
      };
    case "medium":
      return {
        border: "border-l-4 border-l-primary",
        badge: "bg-primary/10 text-primary",
        label: "Medium",
      };
    default:
      return {
        border: "",
        badge: "",
        label: "",
      };
  }
}

export function ActionCard({
  title,
  subtitle,
  urgency = "low",
  actionLabel = "View",
  onAction,
  metadata,
  className,
}: ActionCardProps) {
  const styles = getUrgencyStyles(urgency);

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border bg-card p-4",
        styles.border,
        className
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {urgency !== "low" && (
            <span className={cn("px-2 py-0.5 text-xs font-medium rounded", styles.badge)}>
              {styles.label}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-sm text-muted-foreground truncate">{subtitle}</span>
        )}
        {metadata && (
          <span className="text-xs text-muted-foreground">{metadata}</span>
        )}
      </div>
      {onAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="shrink-0 ml-4"
        >
          {actionLabel}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
