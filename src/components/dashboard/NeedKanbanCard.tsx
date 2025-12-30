import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  FileText, 
  MessageSquare, 
  ClipboardCheck, 
  Zap,
  AlertTriangle
} from "lucide-react";
import { UnifiedNeed } from "@/hooks/useUnifiedNeeds";

interface NeedKanbanCardProps {
  need: UnifiedNeed;
  onClick?: () => void;
  className?: string;
}

const NEED_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  approval: CheckCircle,
  document: FileText,
  information: MessageSquare,
  review: ClipboardCheck,
  action: Zap,
};

const URGENCY_STYLES: Record<string, { border: string; bg: string }> = {
  critical: { 
    border: "border-l-destructive", 
    bg: "bg-destructive/5" 
  },
  high: { 
    border: "border-l-amber-500", 
    bg: "bg-amber-500/5" 
  },
  medium: { 
    border: "border-l-primary", 
    bg: "bg-primary/5" 
  },
  low: { 
    border: "border-l-muted-foreground", 
    bg: "bg-background" 
  },
};

const NEED_TYPE_COLORS: Record<string, string> = {
  approval: "text-primary",
  document: "text-blue-500",
  information: "text-amber-500",
  review: "text-purple-500",
  action: "text-green-500",
};

export function NeedKanbanCard({ need, onClick, className }: NeedKanbanCardProps) {
  const Icon = NEED_TYPE_ICONS[need.need_type] || Zap;
  const urgencyStyle = URGENCY_STYLES[need.urgency] || URGENCY_STYLES.low;
  const iconColor = NEED_TYPE_COLORS[need.need_type] || "text-muted-foreground";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border-l-4 border transition-all",
        "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        urgencyStyle.border,
        urgencyStyle.bg,
        className
      )}
    >
      <div className="flex items-start gap-2">
        {/* Type icon */}
        <div className="shrink-0 mt-0.5">
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {need.description}
          </p>
          
          {/* Workstream name */}
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {need.workstreamName}
          </p>

          {/* Due date badge */}
          {need.dueText && (
            <div className="mt-2 flex items-center gap-1">
              {need.isOverdue && (
                <AlertTriangle className="h-3 w-3 text-destructive animate-pulse" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  need.isOverdue 
                    ? "text-destructive" 
                    : need.urgency === "high" 
                      ? "text-amber-600" 
                      : "text-muted-foreground"
                )}
              >
                {need.isOverdue ? "Overdue " : "Due "}
                {need.dueText}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
