import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Building2, Target } from "lucide-react";
import { format } from "date-fns";
import { WorkstreamOverviewTab } from "@/components/workstream/WorkstreamOverviewTab";
import { WorkstreamApprovalsTab } from "@/components/workstream/WorkstreamApprovalsTab";
import { WorkstreamActivityTab } from "@/components/workstream/WorkstreamActivityTab";
import { WorkstreamDocumentsTab } from "@/components/workstream/WorkstreamDocumentsTab";

interface WorkstreamDetailProps {
  module: "law" | "sales";
}

const stageColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  closed_lost: "bg-muted text-muted-foreground",
};

const stageLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  signed: "Signed",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function WorkstreamDetail({ module }: WorkstreamDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const displayName = module === "sales" ? "Deal" : "Matter";
  const backPath = module === "sales" ? "/sales/deals" : "/law/matters";

  const { data: workstream, isLoading, error } = useQuery({
    queryKey: ["workstream", id],
    queryFn: async () => {
      if (!id) throw new Error("No workstream ID provided");
      
      const { data, error } = await supabase
        .from("workstreams")
        .select(`
          *,
          counterparty:counterparties(*),
          workstream_type:workstream_types(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Workstream not found");
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !workstream) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground">{displayName} not found</p>
        <Button variant="outline" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {module === "sales" ? "Deals" : "Matters"}
        </Button>
      </div>
    );
  }

  const stage = workstream.stage || "draft";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{workstream.name}</h1>
            <Badge className={stageColors[stage]}>
              {stageLabels[stage] || stage}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {workstream.counterparty && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {workstream.counterparty.name}
              </span>
            )}
            {workstream.workstream_type && (
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                {workstream.workstream_type.display_name || workstream.workstream_type.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Created {format(new Date(workstream.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WorkstreamOverviewTab workstream={workstream} module={module} />
        </TabsContent>

        <TabsContent value="approvals">
          <WorkstreamApprovalsTab workstreamId={workstream.id} />
        </TabsContent>

        <TabsContent value="documents">
          <WorkstreamDocumentsTab workstreamId={workstream.id} />
        </TabsContent>

        <TabsContent value="activity">
          <WorkstreamActivityTab workstreamId={workstream.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}