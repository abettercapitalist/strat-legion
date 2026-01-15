import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, ChevronRight, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useRoles, Role } from "@/hooks/useRoles";
import { CreateRoleModal } from "./CreateRoleModal";

interface MultiRoleComboboxProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  workRoutingOnly?: boolean;
}

export function MultiRoleCombobox({
  value,
  onValueChange,
  placeholder = "Select roles...",
  disabled = false,
  error = false,
  workRoutingOnly = true,
}: MultiRoleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createAsSubgroupOf, setCreateAsSubgroupOf] = useState<Role | null>(null);
  
  const { roles, roleHierarchy, isLoading, getRolePath } = useRoles({ workRoutingOnly });

  // Get display info for selected roles
  const selectedRoles = useMemo(() => {
    return value
      .map(id => {
        const role = roles.find(r => r.id === id);
        return role ? { id: role.id, name: role.display_name || role.name } : null;
      })
      .filter((r): r is { id: string; name: string } => r !== null);
  }, [value, roles]);

  const handleSelect = (roleId: string) => {
    if (value.includes(roleId)) {
      onValueChange(value.filter(id => id !== roleId));
    } else {
      onValueChange([...value, roleId]);
    }
  };

  const handleRemove = (roleId: string) => {
    onValueChange(value.filter(id => id !== roleId));
  };

  const handleAddRole = () => {
    setCreateAsSubgroupOf(null);
    setShowCreateModal(true);
  };

  const handleAddSubgroup = (parentRole: Role) => {
    setCreateAsSubgroupOf(parentRole);
    setShowCreateModal(true);
  };

  const handleRoleCreated = (newRole: Role) => {
    onValueChange([...value, newRole.id]);
    setShowCreateModal(false);
    setCreateAsSubgroupOf(null);
  };

  return (
    <>
      <div className="space-y-2">
        {/* Selected roles as badges */}
        {selectedRoles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedRoles.map((role) => (
              <Badge key={role.id} variant="secondary" className="gap-1">
                {role.name}
                <button
                  type="button"
                  onClick={() => handleRemove(role.id)}
                  className="ml-1 hover:bg-muted rounded-full"
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
                error && "border-destructive"
              )}
            >
              <span className="text-muted-foreground">
                {isLoading ? "Loading..." : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search roles..." />
              <CommandList>
                <CommandEmpty>No roles found.</CommandEmpty>
                
                {roleHierarchy.map(({ parent, subgroups }) => (
                  <CommandGroup key={parent.id} heading={parent.display_name || parent.name}>
                    {/* Parent role option */}
                    <CommandItem
                      value={parent.display_name || parent.name}
                      onSelect={() => handleSelect(parent.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(parent.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {parent.display_name || parent.name}
                      {parent.is_manager_role && (
                        <span className="ml-2 text-xs text-muted-foreground">(Manager)</span>
                      )}
                    </CommandItem>
                    
                    {/* Subgroups */}
                    {subgroups.map((subgroup) => (
                      <CommandItem
                        key={subgroup.id}
                        value={`${parent.display_name || parent.name} ${subgroup.display_name || subgroup.name}`}
                        onSelect={() => handleSelect(subgroup.id)}
                        className="pl-6"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.includes(subgroup.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <ChevronRight className="mr-1 h-3 w-3 text-muted-foreground" />
                        {subgroup.display_name || subgroup.name}
                        {subgroup.is_manager_role && (
                          <span className="ml-2 text-xs text-muted-foreground">(Manager)</span>
                        )}
                      </CommandItem>
                    ))}
                    
                    {/* Add subgroup option */}
                    <CommandItem
                      value={`add-subgroup-${parent.id}`}
                      onSelect={() => handleAddSubgroup(parent)}
                      className="pl-6 text-muted-foreground"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add sub-group
                    </CommandItem>
                  </CommandGroup>
                ))}
                
                <CommandSeparator />
                
                <CommandGroup>
                  <CommandItem
                    value="add-new-role"
                    onSelect={handleAddRole}
                    className="text-muted-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create new role
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <CreateRoleModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        parentRole={createAsSubgroupOf}
        onRoleCreated={handleRoleCreated}
        isWorkRouting={workRoutingOnly}
      />
    </>
  );
}
