import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, User, Users, Clock } from "lucide-react";
import { type NeedsFilterType } from "@/hooks/useNeedsFilter";

interface NeedsFilterBarProps {
  activeFilter: NeedsFilterType;
  filterLabel: string | null;
  onClearFilter: () => void;
  onSetFilter: (filter: NeedsFilterType) => void;
  teamRoleFilter?: string | null;
  onClearTeamRoleFilter?: () => void;
  counts?: {
    myNeeds?: number;
    teamQueue?: number;
    waitingFor?: number;
  };
  // New props for role chips
  availableTeamRoles?: string[];
  roleCounts?: Record<string, number>;
  onSetTeamRoleFilter?: (role: string | null) => void;
}

export function NeedsFilterBar({
  activeFilter,
  filterLabel,
  onClearFilter,
  onSetFilter,
  teamRoleFilter,
  onClearTeamRoleFilter,
  counts,
  availableTeamRoles,
  roleCounts,
  onSetTeamRoleFilter,
}: NeedsFilterBarProps) {
  const filters: { key: NeedsFilterType; label: string; icon: React.ElementType }[] = [
    { key: "all", label: "All", icon: Filter },
    { key: "my-needs", label: "My Actions", icon: User },
    { key: "team-queue", label: "Team Queue", icon: Users },
    { key: "waiting-for", label: "Waiting For", icon: Clock },
  ];

  const handleClear = () => {
    if (teamRoleFilter && onClearTeamRoleFilter) {
      onClearTeamRoleFilter();
    } else {
      onClearFilter();
    }
  };

  const formatRoleName = (role: string) => {
    return role.replace(/_/g, " ");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter Pills */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
        {filters.map(({ key, label, icon: Icon }) => {
          const isActive = activeFilter === key;
          const count = key === "my-needs" ? counts?.myNeeds 
            : key === "team-queue" ? counts?.teamQueue 
            : key === "waiting-for" ? counts?.waitingFor 
            : undefined;

          return (
            <Button
              key={key}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSetFilter(key)}
              className={`h-8 gap-1.5 ${isActive ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {count !== undefined && count > 0 && (
                <Badge 
                  variant="outline" 
                  className={`ml-1 h-5 px-1.5 text-xs ${
                    isActive 
                      ? "bg-primary/10 text-primary border-primary/20" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Role Chips - shown when Team Queue is active */}
      {activeFilter === "team-queue" && availableTeamRoles && availableTeamRoles.length > 0 && (
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
          <Button
            variant={!teamRoleFilter ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSetTeamRoleFilter?.(null)}
            className={`h-7 text-xs ${!teamRoleFilter ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
          >
            All Roles
          </Button>
          {availableTeamRoles.map((role) => {
            const isActive = teamRoleFilter === role;
            const count = roleCounts?.[role] || 0;
            
            return (
              <Button
                key={role}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSetTeamRoleFilter?.(role)}
                className={`h-7 text-xs gap-1 capitalize ${isActive ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
              >
                {formatRoleName(role)}
                {count > 0 && (
                  <Badge 
                    variant="outline" 
                    className={`h-4 px-1 text-[10px] ${
                      isActive 
                        ? "bg-primary/10 text-primary border-primary/20" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Active Filter Indicator */}
      {filterLabel && activeFilter !== "all" && (
        <Badge 
          variant="outline" 
          className="bg-primary/10 text-primary border-primary/20 pl-2 pr-1 py-1 gap-1 capitalize"
        >
          Showing: {filterLabel}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-4 w-4 p-0 hover:bg-primary/20 rounded-full ml-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}
