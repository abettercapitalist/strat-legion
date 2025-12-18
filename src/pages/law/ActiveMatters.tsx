import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Plus, 
  FolderOpen, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  MessageSquare, 
  Flag, 
  Archive,
  AlertTriangle,
  Clock,
  User
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";

type Workstream = {
  id: string;
  name: string;
  stage: string | null;
  tier: string | null;
  business_objective: string | null;
  created_at: string;
  updated_at: string;
  expected_close_date: string | null;
  owner_id: string | null;
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
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  at_risk: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  closed_lost: "bg-muted text-muted-foreground",
};

const stageLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  signed: "Signed",
  at_risk: "At Risk",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const counterpartyTypeColors: Record<string, string> = {
  customer: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  vendor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  partner: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  other: "bg-muted text-muted-foreground",
};

function getNextAction(stage: string | null): string {
  switch (stage) {
    case "draft":
      return "Submit for approval";
    case "pending_approval":
      return "Waiting on approval";
    case "approved":
      return "Ready for signature";
    case "signed":
      return "Complete onboarding";
    case "rejected":
      return "Review and resubmit";
    default:
      return "Review status";
  }
}

function getDueUrgency(dueDate: string | null): "overdue" | "urgent" | "normal" | null {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (isPast(date)) return "overdue";
  if (isWithinInterval(new Date(), { start: new Date(), end: addDays(new Date(), 3) })) return "urgent";
  return "normal";
}

export default function ActiveMatters() {
  const navigate = useNavigate();
  const { labels } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const { data: workstreams, isLoading } = useQuery({
    queryKey: ["law-workstreams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstreams")
        .select(`
          id,
          name,
          stage,
          tier,
          business_objective,
          created_at,
          updated_at,
          expected_close_date,
          owner_id,
          counterparty:counterparties(name, counterparty_type),
          workstream_type:workstream_types(display_name, name)
        `)
        .not("stage", "in", "(archived,closed_won,closed_lost)")
        .order("updated_at", { ascending: false });

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
  }).sort((a, b) => {
    switch (sortBy) {
      case "due_soon":
        if (!a.expected_close_date) return 1;
        if (!b.expected_close_date) return -1;
        return new Date(a.expected_close_date).getTime() - new Date(b.expected_close_date).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "recent":
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  const getOwnerInitials = (workstream: Workstream) => {
    // In production, this would come from a joined profiles table
    return "JD";
  };

  const getOwnerName = (workstream: Workstream) => {
    // In production, this would come from a joined profiles table
    return "Jane Doe";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Active {labels.matters}</h1>
          <p className="text-muted-foreground">
            All {labels.matters.toLowerCase()} requiring attention from you or your team
          </p>
        </div>
        <Button onClick={() => navigate("/law/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New {labels.matter}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my">My {labels.matters}</TabsTrigger>
          <TabsTrigger value="team">Team {labels.matters}</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${labels.matters.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredWorkstreams && filteredWorkstreams.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Counterparty</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead className="w-[150px]">Owner</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead className="w-[140px]">Due Date</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkstreams.map((ws) => {
                const dueUrgency = getDueUrgency(ws.expected_close_date);
                return (
                  <TableRow 
                    key={ws.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/law/matters/${ws.id}`)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{ws.counterparty?.name || ws.name}</span>
                        {ws.counterparty?.counterparty_type && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs w-fit ${counterpartyTypeColors[ws.counterparty.counterparty_type] || counterpartyTypeColors.other}`}
                          >
                            {ws.counterparty.counterparty_type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={stageColors[ws.stage || "draft"]} variant="secondary">
                        {stageLabels[ws.stage || "draft"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ws.tier === "high" || ws.tier === "strategic" ? (
                        <Flag className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {getOwnerInitials(ws)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getOwnerName(ws)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getNextAction(ws.stage)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ws.expected_close_date ? (
                        <div className="flex items-center gap-1.5">
                          {dueUrgency === "overdue" && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {dueUrgency === "urgent" && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={`text-sm ${
                            dueUrgency === "overdue" ? "text-red-600 font-medium" :
                            dueUrgency === "urgent" ? "text-yellow-600" :
                            "text-muted-foreground"
                          }`}>
                            {format(new Date(ws.expected_close_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/law/matters/${ws.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {ws.stage === "pending_approval" && (
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Note
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Flag className="h-4 w-4 mr-2" />
                            {ws.tier === "high" || ws.tier === "strategic" ? "Unflag" : "Flag"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center bg-muted/20">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery || stageFilter !== "all" 
              ? `No ${labels.matters.toLowerCase()} match your filters`
              : `No active ${labels.matters.toLowerCase()} yet`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || stageFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : `Get started by creating your first ${labels.matter.toLowerCase()}`}
          </p>
          {!searchQuery && stageFilter === "all" && (
            <Button onClick={() => navigate("/law/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first {labels.matter.toLowerCase()}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
