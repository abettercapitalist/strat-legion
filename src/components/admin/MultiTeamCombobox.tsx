import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTeams, type Team } from "@/hooks/useTeams";
import { CreateTeamModal } from "./CreateTeamModal";

interface MultiTeamComboboxProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  excludeCounterparty?: boolean;
}

export function MultiTeamCombobox({
  value = [],
  onValueChange,
  placeholder = "Select teams...",
  disabled = false,
  error,
  excludeCounterparty = false,
}: MultiTeamComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [createAsSubgroupOf, setCreateAsSubgroupOf] = React.useState<Team | null>(null);

  const onValueChangeRef = React.useRef(onValueChange);
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const { teams, teamHierarchy, isLoading, getTeamById, getTeamPath } = useTeams();

  // Ensure value is always an array
  const selectedIds = Array.isArray(value) ? value : [];

  // Get display info for selected teams
  const selectedTeams = React.useMemo(() => {
    return selectedIds
      .map((id) => {
        const team = getTeamById(id);
        return team ? { id, name: team.display_name, path: getTeamPath(id) } : null;
      })
      .filter(Boolean) as { id: string; name: string; path: string }[];
  }, [selectedIds, getTeamById, getTeamPath]);

  // Use only resolved (valid) team IDs for all mutations
  const resolvedIds = React.useMemo(() => selectedTeams.map((t) => t.id), [selectedTeams]);

  const handleSelect = (teamId: string) => {
    if (resolvedIds.includes(teamId)) {
      onValueChangeRef.current(resolvedIds.filter((id) => id !== teamId));
    } else {
      onValueChangeRef.current([...resolvedIds, teamId]);
    }
  };

  const handleRemove = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChangeRef.current(resolvedIds.filter((id) => id !== teamId));
  };

  const handleAddTeam = () => {
    setCreateAsSubgroupOf(null);
    setShowCreateModal(true);
    setOpen(false);
  };

  const handleAddSubgroup = (parentTeam: Team) => {
    setCreateAsSubgroupOf(parentTeam);
    setShowCreateModal(true);
    setOpen(false);
  };

  const handleTeamCreated = (newTeam: Team) => {
    onValueChangeRef.current([...selectedIds, newTeam.id]);
    setShowCreateModal(false);
    setCreateAsSubgroupOf(null);
  };

  // Filter out teams that shouldn't be shown
  const filteredHierarchy = React.useMemo(() => {
    return teamHierarchy
      .filter((group) => {
        if (excludeCounterparty && group.parent.name === "counterparty") {
          return false;
        }
        return true;
      })
      .map((group) => ({
        ...group,
        subgroups: group.subgroups.filter((sub) => {
          if (excludeCounterparty && sub.name === "counterparty") {
            return false;
          }
          return true;
        }),
      }));
  }, [teamHierarchy, excludeCounterparty]);

  return (
    <>
      <div className="space-y-2">
        {/* Selected teams as badges */}
        {selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedTeams.map((team) => (
              <Badge
                key={team.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">{team.path}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(team.id, e)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || isLoading}
              className={cn(
                "w-full justify-between",
                error && "border-destructive",
                !selectedTeams.length && "text-muted-foreground"
              )}
            >
              {isLoading
                ? "Loading teams..."
                : selectedTeams.length > 0
                ? `${selectedTeams.length} team${selectedTeams.length > 1 ? "s" : ""} selected`
                : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 z-50 bg-popover" align="start">
            <Command>
              <CommandInput placeholder="Search teams..." />
              <CommandList>
                <CommandEmpty>No teams found.</CommandEmpty>

                {filteredHierarchy.map(({ parent, subgroups }) => (
                  <CommandGroup key={parent.id} heading={parent.display_name}>
                    {/* Parent team option */}
                    <CommandItem
                      value={`${parent.display_name}`}
                      onSelect={() => handleSelect(parent.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            resolvedIds.includes(parent.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{parent.display_name}</span>
                      </div>
                      {subgroups.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {subgroups.length} sub-group{subgroups.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </CommandItem>

                    {/* Sub-groups */}
                    {subgroups.map((subgroup) => (
                      <CommandItem
                        key={subgroup.id}
                        value={`${parent.display_name} ${subgroup.display_name}`}
                        onSelect={() => handleSelect(subgroup.id)}
                        className="pl-8"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            resolvedIds.includes(subgroup.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-muted-foreground mr-1">&rarr;</span>
                        {subgroup.display_name}
                      </CommandItem>
                    ))}

                    {/* Add sub-group action */}
                    <CommandItem
                      value={`add-subgroup-${parent.id}`}
                      onSelect={() => handleAddSubgroup(parent)}
                      className="pl-8 text-muted-foreground"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add sub-group to {parent.display_name}
                    </CommandItem>
                  </CommandGroup>
                ))}

                <CommandSeparator />

                {/* Add new parent team */}
                <CommandGroup>
                  <CommandItem
                    value="add-new-team"
                    onSelect={handleAddTeam}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new team
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTeamCreated={handleTeamCreated}
        parentTeam={createAsSubgroupOf}
      />
    </>
  );
}
