import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useCallback } from "react";

export interface Role {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_system_role: boolean;
  is_work_routing: boolean;
  is_manager_role: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleInput {
  name: string;
  display_name?: string;
  description?: string;
  is_work_routing?: boolean;
  is_manager_role?: boolean;
  parent_id?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  display_name?: string;
  description?: string;
  is_work_routing?: boolean;
  is_manager_role?: boolean;
  parent_id?: string | null;
}

/**
 * Unified hook for managing roles that serve as both:
 * 1. Permission groups (RBAC - feature access)
 * 2. Work routing teams (who gets assigned tasks/approvals)
 * 
 * Replaces the old useTeams hook.
 */
export function useRoles(options?: { workRoutingOnly?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ["roles", options?.workRoutingOnly],
    queryFn: async () => {
      let query = supabase
        .from("roles")
        .select("*")
        .order("is_system_role", { ascending: false })
        .order("name", { ascending: true });

      if (options?.workRoutingOnly) {
        query = query.eq("is_work_routing", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Role[];
    },
  });

  const createRole = useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          name: input.name,
          display_name: input.display_name || input.name,
          description: input.description || null,
          is_work_routing: input.is_work_routing ?? false,
          is_manager_role: input.is_manager_role ?? false,
          parent_id: input.parent_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Role;
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Role created",
        description: `${newRole.display_name || newRole.name} has been added successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRoleInput }) => {
      const { data, error } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper: Get all parent roles (roles with no parent_id)
  const getParentRoles = useCallback(() => {
    return roles.filter((role) => !role.parent_id);
  }, [roles]);

  // Helper: Get sub-groups for a specific parent role
  const getSubgroups = useCallback(
    (parentId: string) => {
      return roles.filter((role) => role.parent_id === parentId);
    },
    [roles]
  );

  // Helper: Check if a role has sub-groups
  const hasSubgroups = useCallback(
    (roleId: string) => {
      return roles.some((role) => role.parent_id === roleId);
    },
    [roles]
  );

  // Helper: Get the full path for a role (e.g., "Sales > Inside Sales")
  const getRolePath = useCallback(
    (roleId: string): string => {
      const role = roles.find((r) => r.id === roleId);
      if (!role) return "";

      if (role.parent_id) {
        const parent = roles.find((r) => r.id === role.parent_id);
        if (parent) {
          return `${parent.display_name || parent.name} > ${role.display_name || role.name}`;
        }
      }
      return role.display_name || role.name;
    },
    [roles]
  );

  // Helper: Get role by ID
  const getRoleById = useCallback(
    (roleId: string) => {
      return roles.find((r) => r.id === roleId);
    },
    [roles]
  );

  // Helper: Get work routing roles only
  const getWorkRoutingRoles = useCallback(() => {
    return roles.filter((role) => role.is_work_routing);
  }, [roles]);

  // Helper: Get manager roles
  const getManagerRoles = useCallback(() => {
    return roles.filter((role) => role.is_manager_role);
  }, [roles]);

  // Organized hierarchy for display
  const roleHierarchy = useMemo(() => {
    const parentRoles = roles.filter((r) => !r.parent_id);
    return parentRoles.map((parent) => ({
      parent,
      subgroups: roles.filter((r) => r.parent_id === parent.id),
    }));
  }, [roles]);

  return {
    roles,
    roleHierarchy,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    getParentRoles,
    getSubgroups,
    hasSubgroups,
    getRolePath,
    getRoleById,
    getWorkRoutingRoles,
    getManagerRoles,
  };
}

/**
 * Hook for work routing only - convenience wrapper
 */
export function useWorkRoutingRoles() {
  return useRoles({ workRoutingOnly: true });
}
