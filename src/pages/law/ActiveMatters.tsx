import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FolderOpen, Calendar, Building2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type Workstream = {
  id: string;
  name: string;
  stage: string | null;
  business_objective: string | null;
  created_at: string;
  expected_close_date: string | null;
  counterparty: {
    name: string;
    counterparty_type: string | null;
  } | null;
  workstream_type: {
    display_name: string | null;
    name: string;
  } | null;
};

const stageColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  signed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
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

export default function ActiveMatters() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data: workstreams, isLoading } = useQuery({
    queryKey: ["law-workstreams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstreams")
        .select(`
          id,
          name,
          stage,
          business_objective,
          created_at,
          expected_close_date,
          counterparty:counterparties(name, counterparty_type),
          workstream_type:workstream_types(display_name, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Workstream[];
    },
  });

  const filteredWorkstreams = workstreams?.filter((ws) => {
    const matchesSearch = 
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.counterparty?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.business_objective?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === "all" || ws.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Active Matters</h1>
          <p className="text-muted-foreground">
            View and manage all your active legal matters
          </p>
        </div>
        <Button onClick={() => navigate("/law/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Matter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search matters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWorkstreams && filteredWorkstreams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkstreams.map((ws) => (
            <Card 
              key={ws.id} 
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(`/law/matters/${ws.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {ws.name}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Badge className={stageColors[ws.stage || "draft"]} variant="secondary">
                  {stageLabels[ws.stage || "draft"]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {ws.counterparty && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="line-clamp-1">{ws.counterparty.name}</span>
                  </div>
                )}
                {ws.workstream_type && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    <span>{ws.workstream_type.display_name || ws.workstream_type.name}</span>
                  </div>
                )}
                {ws.expected_close_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Target: {format(new Date(ws.expected_close_date), "MMM d, yyyy")}</span>
                  </div>
                )}
                {ws.business_objective && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ws.business_objective}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No matters found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || stageFilter !== "all" 
              ? "Try adjusting your search or filters"
              : "Get started by creating your first matter"}
          </p>
          {!searchQuery && stageFilter === "all" && (
            <Button onClick={() => navigate("/law/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Matter
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
