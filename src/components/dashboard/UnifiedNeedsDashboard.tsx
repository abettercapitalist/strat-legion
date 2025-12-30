import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hand, Users, Hourglass, ArrowRight, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  useUnifiedNeeds, 
  getNeedTypeBreakdown, 
  getRoleBreakdown, 
  getStatusBreakdown 
} from "@/hooks/useUnifiedNeeds";
import { NeedLaneHeader } from "./NeedLaneHeader";
import { NeedKanbanCard } from "./NeedKanbanCard";
import { VisualBreakdown } from "./VisualBreakdown";

interface UnifiedNeedsDashboardProps {
  modulePrefix: string;
  userRole?: string;
  teamRoles?: string[];
}

export function UnifiedNeedsDashboard({
  modulePrefix,
  userRole = "legal_ops",
  teamRoles = ["legal_ops", "contract_counsel", "general_counsel"],
}: UnifiedNeedsDashboardProps) {
  const { myActions, teamQueue, waitingFor, isLoading, isRefreshing, lastUpdated } = useUnifiedNeeds(userRole, teamRoles);
  const navigate = useNavigate();
  const mattersPath = modulePrefix === "sales" ? "deals" : "matters";
  
  // Track when a refresh just completed for animation
  const [showRefreshPulse, setShowRefreshPulse] = useState(false);
  
  useEffect(() => {
    if (lastUpdated && !isRefreshing) {
      // Trigger pulse animation when refresh completes
      setShowRefreshPulse(true);
      const timer = setTimeout(() => setShowRefreshPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, isRefreshing]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Get breakdowns for visual bars
  const myActionsBreakdown = getNeedTypeBreakdown(myActions.items).map(b => ({
    label: b.type,
    value: b.count,
    color: b.color,
  }));

  const teamQueueBreakdown = getRoleBreakdown(teamQueue.groups).map(b => ({
    label: b.role,
    value: b.count,
    color: b.color,
  }));

  const waitingForBreakdown = getStatusBreakdown(waitingFor.items).map(b => ({
    label: b.status,
    value: b.count,
    color: b.color,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="absolute -top-6 right-0 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Updating...</span>
        </div>
      )}
      
      {/* Lane 1: My Actions */}
      <Card className={cn(
        "border-border transition-all duration-500",
        showRefreshPulse && "ring-2 ring-primary/20 animate-pulse"
      )}>
        <CardContent className="pt-6">
          <NeedLaneHeader
            title="My Actions"
            count={myActions.totalCount}
            overdueCount={myActions.overdueCount}
            icon={Hand}
            clickable={true}
            onClick={() => navigate(`/${modulePrefix}/${mattersPath}?filter=my-needs`)}
          />

          {/* Kanban cards */}
          <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto">
            {myActions.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No actions waiting on you
              </p>
            ) : (
              myActions.items.slice(0, 5).map((need) => (
                <NeedKanbanCard
                  key={need.id}
                  need={need}
                  onClick={() => navigate(`/${modulePrefix}/workstream/${need.workstream_id}`)}
                />
              ))
            )}
          </div>

          {/* Visual breakdown */}
          {myActionsBreakdown.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">By type</p>
              <VisualBreakdown segments={myActionsBreakdown} />
            </div>
          )}

          {/* View all link */}
          {myActions.totalCount > 5 && (
            <Link to={`/${modulePrefix}/${mattersPath}?filter=my-needs`}>
              <Button variant="ghost" size="sm" className="w-full justify-between mt-3">
                View All ({myActions.totalCount})
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Lane 2: Team Queue */}
      <Card className={cn(
        "border-border transition-all duration-500",
        showRefreshPulse && "ring-2 ring-primary/20 animate-pulse"
      )}>
        <CardContent className="pt-6">
          <NeedLaneHeader
            title="Team Queue"
            count={teamQueue.totalCount}
            overdueCount={teamQueue.overdueCount}
            icon={Users}
            clickable={true}
            onClick={() => navigate(`/${modulePrefix}/${mattersPath}?filter=team-queue`)}
          />

          {/* Grouped by role */}
          <div className="space-y-3 mb-4 max-h-[320px] overflow-y-auto">
            {teamQueue.groups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No outstanding team needs
              </p>
            ) : (
              teamQueue.groups.slice(0, 5).map((group) => (
                <button
                  key={group.role}
                  onClick={() => navigate(`/${modulePrefix}/${mattersPath}?filter=team-queue&teamRole=${group.role}`)}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm capitalize">
                      {group.roleDisplay}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {group.count} {group.count === 1 ? "need" : "needs"}
                    </span>
                  </div>
                  {group.exampleDescription && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      e.g. {group.exampleDescription}
                    </p>
                  )}
                  {group.overdueCount > 0 && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      {group.overdueCount} overdue
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Visual breakdown */}
          {teamQueueBreakdown.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">By role</p>
              <VisualBreakdown segments={teamQueueBreakdown} />
            </div>
          )}

          {/* View all link */}
          {teamQueue.groups.length > 5 && (
            <Link to={`/${modulePrefix}/${mattersPath}?filter=team-queue`}>
              <Button variant="ghost" size="sm" className="w-full justify-between mt-3">
                View All ({teamQueue.totalCount})
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Lane 3: Waiting For */}
      <Card className={cn(
        "border-border transition-all duration-500",
        showRefreshPulse && "ring-2 ring-primary/20 animate-pulse"
      )}>
        <CardContent className="pt-6">
          <NeedLaneHeader
            title="Waiting For"
            count={waitingFor.totalCount}
            overdueCount={waitingFor.overdueCount}
            icon={Hourglass}
            clickable={true}
            onClick={() => navigate(`/${modulePrefix}/${mattersPath}?filter=waiting-for`)}
          />

          {/* Kanban cards */}
          <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto">
            {waitingFor.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nothing blocking your workstreams
              </p>
            ) : (
              waitingFor.items.slice(0, 5).map((need) => (
                <NeedKanbanCard
                  key={need.id}
                  need={need}
                  onClick={() => navigate(`/${modulePrefix}/workstream/${need.workstream_id}`)}
                />
              ))
            )}
          </div>

          {/* Visual breakdown */}
          {waitingForBreakdown.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">By status</p>
              <VisualBreakdown segments={waitingForBreakdown} />
            </div>
          )}

          {/* View all link */}
          {waitingFor.totalCount > 5 && (
            <Link to={`/${modulePrefix}/${mattersPath}?filter=waiting-for`}>
              <Button variant="ghost" size="sm" className="w-full justify-between mt-3">
                View All ({waitingFor.totalCount})
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
