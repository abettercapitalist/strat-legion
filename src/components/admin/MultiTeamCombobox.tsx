import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTeams } from "@/hooks/useTeams";

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

  const handleSelect = (teamId: string) => {
    if (selectedIds.includes(teamId)) {
      // Remove if already selected
      onValueChange(selectedIds.filter((id) => id !== teamId));
    } else {
      // Add to selection
      onValueChange([...selectedIds, teamId]);
    }
  };

  const handleRemove = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(selectedIds.filter((id) => id !== teamId));
  };

  // Filter out teams that shouldn't be shown as approvers
  const filteredHierarchy = React.useMemo(() => {
    return teamHierarchy
      .filter((group) => {
        // Exclude "counterparty" team if requested
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
              !selectedIds.length && "text-muted-foreground"
            )}
          >
            {isLoading
              ? "Loading teams..."
              : selectedIds.length > 0
              ? `${selectedIds.length} team${selectedIds.length > 1 ? "s" : ""} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Search teams..." />
            <CommandList>
              <CommandEmpty>No team found.</CommandEmpty>
              {filteredHierarchy.map((group) => (
                <CommandGroup key={group.parent.id} heading={group.parent.display_name}>
                  {/* Parent team option */}
                  <CommandItem
                    value={`${group.parent.display_name}-parent`}
                    onSelect={() => handleSelect(group.parent.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(group.parent.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{group.parent.display_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">(all)</span>
                  </CommandItem>

                  {/* Subgroup options */}
                  {group.subgroups.map((subgroup) => (
                    <CommandItem
                      key={subgroup.id}
                      value={`${group.parent.display_name}-${subgroup.display_name}`}
                      onSelect={() => handleSelect(subgroup.id)}
                      className="cursor-pointer pl-6"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.includes(subgroup.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{subgroup.display_name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
