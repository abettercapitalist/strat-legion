import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useNeedsFilter } from "@/hooks/useNeedsFilter";
import { NeedsFilterBar } from "@/components/filters/NeedsFilterBar";
import { toast } from "sonner";

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
  last_activity_date: string | null;
  counterparty: {
    name: string;
    counterparty_type: string | null;
  } | null;
  workstream_type: {
    display_name: string | null;
    name: string;
  } | null;
};

type SortColumn = "counterparty" | "status" | "priority" | "lastAction" | "nextAction" | "owner" | "dueDate";
type SortDirection = "asc" | "desc";

type Need = {
  id: string;
  workstream_id: string;
  satisfier_role: string | null;
  status: string;
  source_type: string;
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
  const queryClient = useQueryClient();
  const { labels } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "lastAction",
    direction: "desc",
  });

  const { activeFilter, setFilter, clearFilter, filterLabel, userRole, teamRoleFilter, setTeamRoleFilter, workRoutingRoleIds, customRoles } = useNeedsFilter();

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (workstreamId: string) => {
      const { error } = await supabase
        .from("workstreams")
        .update({ stage: "archived" })
        .eq("id", workstreamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["law-workstreams"] });
      toast.success("Matter archived successfully");
    },
    onError: () => {
      toast.error("Failed to archive matter");
    },
  });

  const handleSort = (column: SortColumn) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // Fetch workstreams with last activity
  const { data: workstreams, isLoading: isLoadingWorkstreams } = useQuery({
    queryKey: ["law-workstreams"],
    queryFn: async () => {
      // First fetch workstreams
      const { data: wsData, error: wsError } = await supabase
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

      if (wsError) throw wsError;

      // Fetch last activity for each workstream
      const workstreamIds = wsData.map(ws => ws.id);
      const { data: activityData } = await supabase
        .from("workstream_activity")
        .select("workstream_id, created_at")
        .in("workstream_id", workstreamIds)
        .order("created_at", { ascending: false });

      // Build a map of workstream_id -> latest activity date
      const lastActivityMap = new Map<string, string>();
      activityData?.forEach(activity => {
        if (!lastActivityMap.has(activity.workstream_id)) {
          lastActivityMap.set(activity.workstream_id, activity.created_at);
        }
      });

      // Merge last activity into workstreams
      return wsData.map(ws => ({
        ...ws,
        last_activity_date: lastActivityMap.get(ws.id) || null,
      })) as unknown as Workstream[];
    },
  });

  // Fetch needs for filtering
  const { data: needs, isLoading: isLoadingNeeds } = useQuery({
    queryKey: ["needs-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("needs")
        .select("id, workstream_id, satisfier_role, status, source_type")
        .eq("status", "open");

      if (error) throw error;
      return data as Need[];
    },
  });

  const isLoading = isLoadingWorkstreams || isLoadingNeeds;

  // Use unified role system - combine legacy role strings, UUIDs, and custom role names
  const allRoleIds = useMemo(() => {
    const roles = new Set<string>();
    // Add legacy role string (e.g., "general_counsel")
    if (userRole) roles.add(userRole);
    // Add UUID-based role IDs from work routing
    workRoutingRoleIds.forEach(r => roles.add(r));
    // Add custom role names for legacy data matching (needs.satisfier_role contains legacy strings)
    customRoles.forEach(r => {
      roles.add(r.id);
      roles.add(r.name); // This enables matching "general_counsel" in needs.satisfier_role
    });
    return Array.from(roles);
  }, [userRole, workRoutingRoleIds, customRoles]);

  // Calculate filter counts including role breakdown
  const filterCounts = useMemo(() => {
    if (!needs || !workstreams || !userRole) return { myNeeds: 0, teamQueue: 0, waitingFor: 0, roleBreakdown: {} };

    const workstreamIds = new Set(workstreams.map(ws => ws.id));

    // Only count needs for workstreams in our list
    const relevantNeeds = needs.filter(n => workstreamIds.has(n.workstream_id));

    // My needs: match any of my role IDs
    const myNeeds = new Set(
      relevantNeeds
        .filter(n => n.satisfier_role && allRoleIds.includes(n.satisfier_role))
        .map(n => n.workstream_id)
    ).size;

    // Team queue: roles in our set but not directly assigned to current user's primary role
    const teamQueue = new Set(
      relevantNeeds
        .filter(n => n.satisfier_role && allRoleIds.includes(n.satisfier_role) && n.satisfier_role !== userRole)
        .map(n => n.workstream_id)
    ).size;

    // Waiting for: roles NOT in our set
    const waitingFor = new Set(
      relevantNeeds
        .filter(n => n.satisfier_role && !allRoleIds.includes(n.satisfier_role))
        .map(n => n.workstream_id)
    ).size;

    // Calculate counts per role for Team Queue chips
    const roleBreakdown: Record<string, number> = {};
    allRoleIds.forEach(roleId => {
      if (roleId !== userRole) {
        roleBreakdown[roleId] = new Set(
          relevantNeeds
            .filter(n => n.satisfier_role === roleId)
            .map(n => n.workstream_id)
        ).size;
      }
    });

    return { myNeeds, teamQueue, waitingFor, roleBreakdown };
  }, [needs, workstreams, userRole, allRoleIds]);

  // Filter workstreams based on needs filter
  const filteredWorkstreams = useMemo(() => {
    if (!workstreams) return [];
    if (!needs || !userRole) return workstreams;

    // Build a map of workstream IDs to their needs
    const workstreamNeedsMap = new Map<string, Need[]>();
    needs.forEach(need => {
      const existing = workstreamNeedsMap.get(need.workstream_id) || [];
      existing.push(need);
      workstreamNeedsMap.set(need.workstream_id, existing);
    });

    let filtered = workstreams;

    // Apply needs-based filter
    if (activeFilter === "my-needs") {
      filtered = workstreams.filter(ws => {
        const wsNeeds = workstreamNeedsMap.get(ws.id) || [];
        return wsNeeds.some(n => n.satisfier_role && allRoleIds.includes(n.satisfier_role));
      });
    } else if (activeFilter === "team-queue") {
      filtered = workstreams.filter(ws => {
        const wsNeeds = workstreamNeedsMap.get(ws.id) || [];
        // If a specific role is selected, filter to just that role
        if (teamRoleFilter) {
          return wsNeeds.some(n => n.satisfier_role === teamRoleFilter);
        }
        // Otherwise, show all team roles except the current user's primary role
        return wsNeeds.some(n => 
          n.satisfier_role && 
          allRoleIds.includes(n.satisfier_role) && 
          n.satisfier_role !== userRole
        );
      });
    } else if (activeFilter === "waiting-for") {
      filtered = workstreams.filter(ws => {
        const wsNeeds = workstreamNeedsMap.get(ws.id) || [];
        return wsNeeds.some(n => 
          n.satisfier_role && 
          !allRoleIds.includes(n.satisfier_role)
        );
      });
    }

    // Apply search filter
    filtered = filtered.filter((ws) => {
      const matchesSearch = 
        ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.counterparty?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.business_objective?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = stageFilter === "all" || ws.stage === stageFilter;
      
      return matchesSearch && matchesStage;
    });

    // Apply sorting based on column headers
    return filtered.sort((a, b) => {
      const { column, direction } = sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      switch (column) {
        case "counterparty":
          const aName = a.counterparty?.name || a.name;
          const bName = b.counterparty?.name || b.name;
          return multiplier * aName.localeCompare(bName);
        case "status":
          return multiplier * (a.stage || "").localeCompare(b.stage || "");
        case "priority":
          const priorityOrder = { strategic: 1, high: 2, standard: 3 };
          const aPriority = priorityOrder[a.tier as keyof typeof priorityOrder] || 4;
          const bPriority = priorityOrder[b.tier as keyof typeof priorityOrder] || 4;
          return multiplier * (aPriority - bPriority);
        case "lastAction":
          if (!a.last_activity_date && !b.last_activity_date) return 0;
          if (!a.last_activity_date) return multiplier;
          if (!b.last_activity_date) return -multiplier;
          return multiplier * (new Date(a.last_activity_date).getTime() - new Date(b.last_activity_date).getTime());
        case "nextAction":
          return multiplier * getNextAction(a.stage).localeCompare(getNextAction(b.stage));
        case "owner":
          // Placeholder until real owner data
          return 0;
        case "dueDate":
          if (!a.expected_close_date && !b.expected_close_date) return 0;
          if (!a.expected_close_date) return multiplier;
          if (!b.expected_close_date) return -multiplier;
          return multiplier * (new Date(a.expected_close_date).getTime() - new Date(b.expected_close_date).getTime());
        default:
          return 0;
      }
    });
  }, [workstreams, needs, activeFilter, userRole, allRoleIds, teamRoleFilter, searchQuery, stageFilter, sortConfig]);

  const getOwnerInitials = (workstream: Workstream) => {
    return "JD";
  };

  const getOwnerName = (workstream: Workstream) => {
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

      {/* Needs Filter Bar */}
      <NeedsFilterBar
        activeFilter={activeFilter}
        filterLabel={filterLabel}
        onClearFilter={clearFilter}
        onSetFilter={setFilter}
        teamRoleFilter={teamRoleFilter}
        onClearTeamRoleFilter={() => setTeamRoleFilter(null)}
        counts={filterCounts}
        availableTeamRoles={customRoles.filter(r => r.id !== userRole)}
        roleCounts={filterCounts.roleBreakdown}
        onSetTeamRoleFilter={setTeamRoleFilter}
      />

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
                <TableHead 
                  className="w-[220px] cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("counterparty")}
                >
                  <div className="flex items-center">
                    Counterparty
                    {getSortIcon("counterparty")}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[130px] cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[80px] cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center">
                    Priority
                    {getSortIcon("priority")}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[90px] cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("lastAction")}
                >
                  <div className="flex items-center">
                    Last Action
                    {getSortIcon("lastAction")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("nextAction")}
                >
                  <div className="flex items-center">
                    Next Action
                    {getSortIcon("nextAction")}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[130px] cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("owner")}
                >
                  <div className="flex items-center">
                    Owner
                    {getSortIcon("owner")}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort("dueDate")}
                >
                  <div className="flex items-center">
                    Due Date
                    {getSortIcon("dueDate")}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
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
                      <span className="text-sm text-muted-foreground">
                        {ws.last_activity_date 
                          ? format(new Date(ws.last_activity_date), "MMM d")
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getNextAction(ws.stage)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {getOwnerInitials(ws)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{getOwnerName(ws)}</span>
                      </div>
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
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveMutation.mutate(ws.id);
                            }}
                          >
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
            {searchQuery || stageFilter !== "all" || activeFilter !== "all"
              ? `No ${labels.matters.toLowerCase()} match your filters`
              : `No active ${labels.matters.toLowerCase()} yet`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || stageFilter !== "all" || activeFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : `Get started by creating your first ${labels.matter.toLowerCase()}`}
          </p>
          {!searchQuery && stageFilter === "all" && activeFilter === "all" && (
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
