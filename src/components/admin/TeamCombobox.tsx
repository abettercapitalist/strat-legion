import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, AlertCircle } from "lucide-react";
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

interface TeamComboboxProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  /** If true, shows a warning when a parent with sub-groups is selected */
  requireSubgroupWhenAvailable?: boolean;
}

export function TeamCombobox({
  value,
  onValueChange,
  placeholder = "Select a team...",
  disabled = false,
  error,
  requireSubgroupWhenAvailable = true,
}: TeamComboboxProps) {
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createAsSubgroupOf, setCreateAsSubgroupOf] = useState<Team | null>(null);
  
  // Use a ref to always have access to the latest callback
  // This fixes stale closure issues when the popover captures old callbacks
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);
  
  const {
    teams,
    teamHierarchy,
    isLoading,
    hasSubgroups,
    getTeamPath,
    getTeamById,
  } = useTeams();

  // Get the selected team - also match by display_name for legacy data
  const selectedTeam = useMemo(() => {
    if (!value) return null;
    // Try exact id match first
    const byId = teams.find((t) => t.id === value);
    if (byId) return byId;
    // Try name match (internal slug)
    const byName = teams.find((t) => t.name === value);
    if (byName) return byName;
    // Try display_name match (for legacy or user-entered values)
    const byDisplayName = teams.find((t) => 
      t.display_name.toLowerCase() === value.toLowerCase()
    );
    if (byDisplayName) return byDisplayName;
    return null;
  }, [value, teams]);

  // Check if selected team needs a sub-group
  const needsSubgroupSelection = useMemo(() => {
    if (!selectedTeam || !requireSubgroupWhenAvailable) return false;
    return hasSubgroups(selectedTeam.id);
  }, [selectedTeam, requireSubgroupWhenAvailable, hasSubgroups]);

  // Display value - show stored value as fallback if no team match
  const displayValue = useMemo(() => {
    if (selectedTeam) {
      return getTeamPath(selectedTeam.id);
    }
    // If we have a value but no matching team, show the raw value
    // This helps debug cases where the value isn't matching
    if (value && !isLoading) {
      return value;
    }
    return "";
  }, [selectedTeam, getTeamPath, value, isLoading]);

  const handleSelect = (teamId: string) => {
    const team = getTeamById(teamId);
    console.log("[TeamCombobox] handleSelect:", { teamId, team, willCall: !!team });
    if (team) {
      // If this team has subgroups and we require subgroup selection,
      // we still select it but show a warning
      console.log("[TeamCombobox] calling onValueChangeRef.current with:", team.id);
      // Use ref to avoid stale closure - ensures we always call the latest callback
      onValueChangeRef.current(team.id);
      setOpen(false);
    }
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
    onValueChangeRef.current(newTeam.id);
    setShowCreateModal(false);
    setCreateAsSubgroupOf(null);
  };

  return (
    <>
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || isLoading}
              className={cn(
                "w-full justify-between",
                !displayValue && "text-muted-foreground",
                (error || needsSubgroupSelection) && "border-destructive"
              )}
            >
              {isLoading ? (
                "Loading teams..."
              ) : displayValue ? (
                <span className="flex items-center gap-2">
                  {displayValue}
                  {needsSubgroupSelection && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      Select sub-group
                    </Badge>
                  )}
                  {!selectedTeam && value && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      Unknown
                    </Badge>
                  )}
                </span>
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search teams..." />
              <CommandList>
                <CommandEmpty>No teams found.</CommandEmpty>
                
                {teamHierarchy.map(({ parent, subgroups }) => (
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
                            selectedTeam?.id === parent.id ? "opacity-100" : "opacity-0"
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
                            selectedTeam?.id === subgroup.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-muted-foreground mr-1">→</span>
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
        
        {/* Warning when parent with sub-groups is selected */}
        {needsSubgroupSelection && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>This team has sub-groups. Please select a specific group.</span>
          </div>
        )}
        
        {/* Error message */}
        {error && !needsSubgroupSelection && (
          <p className="text-xs text-destructive">{error}</p>
        )}
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