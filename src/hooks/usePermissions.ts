import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: "law" | "sales" | "system";
  created_at: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserCustomRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}

// Fetch all permissions
export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module", { ascending: true });
      
      if (error) throw error;
      return data as Permission[];
    },
  });
}

// Fetch all custom roles with their permissions
export function useCustomRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as CustomRole[];
    },
  });
}

// Fetch role-permission mappings
export function useRolePermissions() {
  return useQuery({
    queryKey: ["role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");
      
      if (error) throw error;
      return data as RolePermission[];
    },
  });
}

// Fetch user-role mappings
export function useUserCustomRoles() {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      
      if (error) throw error;
      return data as UserCustomRole[];
    },
  });
}

// Mutations for roles
export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (role: { name: string; description: string; is_system_role?: boolean }) => {
      const { data, error } = await supabase
        .from("roles")
        .insert(role)
        .select()
        .single();
      
      if (error) throw error;
      return data as CustomRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomRole> }) => {
      const { data, error } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CustomRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
    },
  });
}

// Mutations for role permissions
export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      // Delete existing permissions for this role
      await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId);
      
      // Insert new permissions
      if (permissionIds.length > 0) {
        const { error } = await supabase
          .from("role_permissions")
          .insert(permissionIds.map(pid => ({ role_id: roleId, permission_id: pid })));
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
    },
  });
}

// User-role mutations
export function useAssignUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleId })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserCustomRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    },
  });
}

export function useSetUserRoles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
      // Delete existing roles for this user
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      // Insert new roles
      if (roleIds.length > 0) {
        const { error } = await supabase
          .from("user_roles")
          .insert(roleIds.map(rid => ({ user_id: userId, role_id: rid })));
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    },
  });
}

// Helper hook to get permissions for a role
export function useRoleWithPermissions(roleId: string | undefined) {
  const { data: rolePermissions } = useRolePermissions();
  const { data: permissions } = usePermissions();
  
  if (!roleId || !rolePermissions || !permissions) {
    return [];
  }
  
  const permissionIds = rolePermissions
    .filter(rp => rp.role_id === roleId)
    .map(rp => rp.permission_id);
  
  return permissions.filter(p => permissionIds.includes(p.id));
}

// Helper hook to check if current user has a permission
export function useHasPermission(permissionId: string) {
  const { data: userRoles } = useUserCustomRoles();
  const { data: rolePermissions } = useRolePermissions();
  
  return useQuery({
    queryKey: ["has_permission", permissionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      if (!userRoles || !rolePermissions) return false;
      
      const userRoleIds = userRoles
        .filter(ur => ur.user_id === user.id)
        .map(ur => ur.role_id);
      
      return rolePermissions.some(
        rp => userRoleIds.includes(rp.role_id) && rp.permission_id === permissionId
      );
    },
    enabled: !!userRoles && !!rolePermissions,
  });
}
