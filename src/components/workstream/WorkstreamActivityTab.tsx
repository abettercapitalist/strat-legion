import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Bell, 
  User,
  Plus,
  Edit,
  MessageSquare
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface WorkstreamActivityTabProps {
  workstreamId: string;
}

const activityIcons: Record<string, React.ElementType> = {
  created: Plus,
  status_changed: Edit,
  approval_requested: Bell,
  approval_completed: CheckCircle,
  approval_rejected: XCircle,
  document_generated: FileText,
  comment_added: MessageSquare,
  assigned: User,
};

const activityColors: Record<string, string> = {
  created: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
  status_changed: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
  approval_requested: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400",
  approval_completed: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
  approval_rejected: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
  document_generated: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
  comment_added: "bg-muted text-muted-foreground",
  assigned: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400",
};

export function WorkstreamActivityTab({ workstreamId }: WorkstreamActivityTabProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["workstream-activity", workstreamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstream_activity")
        .select(`
          *,
          actor:profiles!workstream_activity_actor_id_fkey(full_name, email)
        `)
        .eq("workstream_id", workstreamId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching activity:", error);
        return [];
      }
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.activity_type] || Clock;
        const colorClass = activityColors[activity.activity_type] || "bg-muted text-muted-foreground";
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="relative flex gap-4 pb-6">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[17px] top-10 bottom-0 w-px bg-border" />
            )}
            
            {/* Icon */}
            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            {/* Content */}
            <div className="flex-1 pt-1">
              <p className="font-medium text-sm">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {activity.actor && (
                  <>
                    <span>{activity.actor.full_name || activity.actor.email}</span>
                    <span>•</span>
                  </>
                )}
                <span title={format(new Date(activity.created_at), "PPpp")}>
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}