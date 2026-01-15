import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, ChevronRight, Plus, AlertTriangle } from "lucide-react";
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
import { useRoles, Role, CreateRoleInput } from "@/hooks/useRoles";
import { CreateRoleModal } from "./CreateRoleModal";

interface RoleComboboxProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  workRoutingOnly?: boolean;
  requireSubgroupWhenAvailable?: boolean;
}

export function RoleCombobox({
  value,
  onValueChange,
  placeholder = "Select role...",
  disabled = false,
  error = false,
  workRoutingOnly = true,
  requireSubgroupWhenAvailable = false,
}: RoleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createAsSubgroupOf, setCreateAsSubgroupOf] = useState<Role | null>(null);
  
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);
  
  const { roles, roleHierarchy, isLoading, hasSubgroups, getRolePath, getRoleById, createRole } = useRoles({ 
    workRoutingOnly 
  });

  // Find the selected role
  const selectedRole = useMemo(() => {
    if (!value) return undefined;
    // Try to find by ID first
    let role = roles.find(r => r.id === value);
    if (role) return role;
    // Fallback: try to find by name
    role = roles.find(r => r.name === value);
    if (role) return role;
    // Fallback: try to find by display_name
    role = roles.find(r => r.display_name === value);
    return role;
  }, [value, roles]);

  // Check if selected role has subgroups but none is selected
  const needsSubgroupSelection = useMemo(() => {
    if (!requireSubgroupWhenAvailable || !selectedRole) return false;
    return hasSubgroups(selectedRole.id);
  }, [requireSubgroupWhenAvailable, selectedRole, hasSubgroups]);

  // Build display value
  const displayValue = useMemo(() => {
    if (!selectedRole) return value || "";
    return getRolePath(selectedRole.id);
  }, [selectedRole, getRolePath, value]);

  const handleSelect = (roleId: string) => {
    onValueChangeRef.current(roleId);
    setOpen(false);
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
    onValueChangeRef.current(newRole.id);
    setShowCreateModal(false);
    setCreateAsSubgroupOf(null);
  };

  // Filter hierarchy for work routing if needed
  const filteredHierarchy = useMemo(() => {
    return roleHierarchy;
  }, [roleHierarchy]);

  return (
    <>
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
              needsSubgroupSelection && "border-amber-500"
            )}
          >
            <span className={cn("truncate", !selectedRole && "text-muted-foreground")}>
              {isLoading ? "Loading..." : (displayValue || placeholder)}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search roles..." />
            <CommandList>
              <CommandEmpty>No roles found.</CommandEmpty>
              
              {filteredHierarchy.map(({ parent, subgroups }) => (
                <CommandGroup key={parent.id} heading={parent.display_name || parent.name}>
                  {/* Parent role option (only if no subgroups or not requiring subgroup) */}
                  {(!requireSubgroupWhenAvailable || subgroups.length === 0) && (
                    <CommandItem
                      value={parent.display_name || parent.name}
                      onSelect={() => handleSelect(parent.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRole?.id === parent.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {parent.display_name || parent.name}
                      {parent.is_manager_role && (
                        <span className="ml-2 text-xs text-muted-foreground">(Manager)</span>
                      )}
                    </CommandItem>
                  )}
                  
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
                          selectedRole?.id === subgroup.id ? "opacity-100" : "opacity-0"
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
                    Add sub-group to {parent.display_name || parent.name}
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

      {needsSubgroupSelection && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          This role has sub-groups. Consider selecting a specific sub-group.
        </p>
      )}

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
