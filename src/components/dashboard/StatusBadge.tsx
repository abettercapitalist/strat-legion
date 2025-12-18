import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "critical" | "neutral" | "info";
type BadgeSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
  status: StatusVariant;
  label: string;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const statusStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: "bg-status-success/10",
    text: "text-status-success",
    dot: "bg-status-success",
  },
  warning: {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning",
  },
  critical: {
    bg: "bg-status-error/10",
    text: "text-status-error",
    dot: "bg-status-error",
  },
  neutral: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  info: {
    bg: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary",
  },
};

const sizeStyles: Record<BadgeSize, { padding: string; text: string; dot: string }> = {
  sm: { padding: "px-1.5 py-0.5", text: "text-xs", dot: "h-1.5 w-1.5" },
  md: { padding: "px-2 py-1", text: "text-sm", dot: "h-2 w-2" },
  lg: { padding: "px-3 py-1.5", text: "text-base", dot: "h-2.5 w-2.5" },
};

export function StatusBadge({
  status,
  label,
  size = "md",
  dot = false,
  className,
}: StatusBadgeProps) {
  const statusStyle = statusStyles[status];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        statusStyle.bg,
        statusStyle.text,
        sizeStyle.padding,
        sizeStyle.text,
        className
      )}
    >
      {dot && (
        <span className={cn("rounded-full", statusStyle.dot, sizeStyle.dot)} />
      )}
      {label}
    </span>
  );
}
