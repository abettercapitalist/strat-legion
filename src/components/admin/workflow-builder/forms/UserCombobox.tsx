import { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserComboboxProps {
  value: string | undefined;
  onValueChange: (userId: string, roleId?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface UserRole {
  role_id: string;
  roles: {
    id: string;
    name: string;
    display_name: string | null;
    is_work_routing: boolean;
  } | null;
}

export function UserCombobox({
  value,
  onValueChange,
  placeholder = 'Select user...',
  disabled = false,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [resolvedRoleName, setResolvedRoleName] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles-combobox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });

  // When a user is selected (or value changes on mount), resolve their role
  useEffect(() => {
    if (!value) {
      setResolvedRoleName(null);
      return;
    }

    async function resolveRole(userId: string) {
      const { data } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name,
            display_name,
            is_work_routing
          )
        `)
        .eq('user_id', userId);

      if (!data || data.length === 0) {
        setResolvedRoleName(null);
        return;
      }

      const userRoles = data as unknown as UserRole[];
      const validRoles = userRoles.filter((ur) => ur.roles !== null);

      // Prefer is_work_routing role, fall back to first
      const workRoutingRole = validRoles.find((ur) => ur.roles!.is_work_routing);
      const bestRole = workRoutingRole || validRoles[0];

      if (bestRole?.roles) {
        setResolvedRoleName(bestRole.roles.display_name || bestRole.roles.name);
      } else {
        setResolvedRoleName(null);
      }
    }

    resolveRole(value);
  }, [value]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value),
    [value, users],
  );

  const displayLabel = (user: Profile) =>
    user.full_name || user.email || user.id;

  const handleSelect = async (userId: string) => {
    // Resolve role for the selected user
    const { data } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name,
          display_name,
          is_work_routing
        )
      `)
      .eq('user_id', userId);

    let roleId: string | undefined;

    if (data && data.length > 0) {
      const userRoles = data as unknown as UserRole[];
      const validRoles = userRoles.filter((ur) => ur.roles !== null);
      const workRoutingRole = validRoles.find((ur) => ur.roles!.is_work_routing);
      const bestRole = workRoutingRole || validRoles[0];

      if (bestRole?.roles) {
        roleId = bestRole.roles.id;
        setResolvedRoleName(bestRole.roles.display_name || bestRole.roles.name);
      }
    } else {
      setResolvedRoleName(null);
    }

    onValueChange(userId, roleId);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className="w-full justify-between"
          >
            <span className={cn('truncate', !selectedUser && 'text-muted-foreground')}>
              {isLoading ? 'Loading...' : selectedUser ? displayLabel(selectedUser) : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={displayLabel(user)}
                    onSelect={() => handleSelect(user.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === user.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{user.full_name || 'Unnamed'}</span>
                      {user.email && (
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <div className="text-xs">
          {resolvedRoleName ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {resolvedRoleName}
            </Badge>
          ) : (
            <span className="text-amber-600">No role assigned</span>
          )}
        </div>
      )}
    </div>
  );
}
