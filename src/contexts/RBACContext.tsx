import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  usePermissions,
  useCustomRoles,
  useRolePermissions,
  useUserCustomRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useSetRolePermissions,
  useSetUserRoles,
  Permission,
  CustomRole,
} from "@/hooks/usePermissions";

// Types for backward compatibility with UI
export interface Role {
  id: string;
  name: string;
  displayName: string | null;
  description: string;
  permissions: string[]; // Permission IDs
  isSystemRole: boolean;
  isWorkRouting: boolean;
  isManagerRole: boolean;
  parentId: string | null;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  department: string;
  title: string;
  isActive: boolean;
  createdAt: string;
}

interface RBACContextType {
  users: SystemUser[];
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  addUser: (user: Omit<SystemUser, "id" | "createdAt">) => Promise<void>;
  updateUser: (id: string, updates: Partial<SystemUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addRole: (role: Omit<Role, "id">) => Promise<void>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  getUserRoles: (userId: string) => Role[];
  hasPermission: (userId: string, permissionId: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  // Fetch data from database
  const { data: dbPermissions = [], isLoading: permissionsLoading } = usePermissions();
  const { data: dbRoles = [], isLoading: rolesLoading } = useCustomRoles();
  const { data: rolePermissions = [], isLoading: rolePermsLoading } = useRolePermissions();
  const { data: userCustomRoles = [], isLoading: userRolesLoading } = useUserCustomRoles();
  
  // Fetch profiles for user display
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      // Get all user_custom_roles first to find relevant users
      const { data: ucr } = await supabase.from("user_custom_roles").select("user_id");
      if (!ucr || ucr.length === 0) return [];
      
      const userIds = [...new Set(ucr.map(r => r.user_id))];
      
      // For now, we'll construct user info from profiles table
      // Note: In production, you'd want a proper admin view
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      
      if (error) throw error;
      return data || [];
    },
  });
  
  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const setRolePermissionsMutation = useSetRolePermissions();
  const setUserRolesMutation = useSetUserRoles();
  
  const isLoading = permissionsLoading || rolesLoading || rolePermsLoading || userRolesLoading || profilesLoading;
  
  // Transform database roles to UI format
  const roles: Role[] = useMemo(() => {
    return dbRoles.map(dbRole => ({
      id: dbRole.id,
      name: dbRole.name,
      displayName: (dbRole as any).display_name || null,
      description: dbRole.description || "",
      isSystemRole: dbRole.is_system_role,
      isWorkRouting: (dbRole as any).is_work_routing ?? false,
      isManagerRole: (dbRole as any).is_manager_role ?? false,
      parentId: (dbRole as any).parent_id || null,
      permissions: rolePermissions
        .filter(rp => rp.role_id === dbRole.id)
        .map(rp => rp.permission_id),
    }));
  }, [dbRoles, rolePermissions]);
  
  // Transform profiles to SystemUser format
  const users: SystemUser[] = useMemo(() => {
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.full_name || profile.email || "Unknown",
      email: profile.email || "",
      department: "", // Not stored in profiles currently
      title: profile.title || "",
      isActive: true, // Not tracked currently
      createdAt: profile.created_at,
      roleIds: userCustomRoles
        .filter(ucr => ucr.user_id === profile.id)
        .map(ucr => ucr.role_id),
    }));
  }, [profiles, userCustomRoles]);
  
  // Cast permissions to correct type
  const permissions: Permission[] = useMemo(() => {
    return dbPermissions.map(p => ({
      ...p,
      module: p.module as "law" | "sales" | "system",
    }));
  }, [dbPermissions]);
  
  // User management - these update profiles and user_custom_roles
  const addUser = async (user: Omit<SystemUser, "id" | "createdAt">) => {
    // Note: Creating users should go through Supabase Auth
    // This function primarily assigns roles to existing users
    console.warn("addUser: Creating users should be done through authentication flow");
  };
  
  const updateUser = async (id: string, updates: Partial<SystemUser>) => {
    if (updates.roleIds) {
      await setUserRolesMutation.mutateAsync({ userId: id, roleIds: updates.roleIds });
    }
    // Profile updates would need a separate mutation
  };
  
  const deleteUser = async (id: string) => {
    // Remove all roles from user
    await setUserRolesMutation.mutateAsync({ userId: id, roleIds: [] });
  };
  
  // Role management
  const addRole = async (role: Omit<Role, "id">) => {
    const newRole = await createRoleMutation.mutateAsync({
      name: role.name,
      description: role.description,
      is_system_role: role.isSystemRole,
      display_name: role.displayName || role.name,
      is_work_routing: role.isWorkRouting,
      is_manager_role: role.isManagerRole,
      parent_id: role.parentId,
    } as any);
    
    if (role.permissions.length > 0) {
      await setRolePermissionsMutation.mutateAsync({
        roleId: newRole.id,
        permissionIds: role.permissions,
      });
    }
  };
  
  const updateRoleHandler = async (id: string, updates: Partial<Role>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.isWorkRouting !== undefined) dbUpdates.is_work_routing = updates.isWorkRouting;
    if (updates.isManagerRole !== undefined) dbUpdates.is_manager_role = updates.isManagerRole;
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
    
    if (Object.keys(dbUpdates).length > 0) {
      await updateRoleMutation.mutateAsync({
        id,
        updates: dbUpdates,
      });
    }
    
    if (updates.permissions) {
      await setRolePermissionsMutation.mutateAsync({
        roleId: id,
        permissionIds: updates.permissions,
      });
    }
  };
  
  const deleteRoleHandler = async (id: string) => {
    await deleteRoleMutation.mutateAsync(id);
  };
  
  // Helper functions
  const getUserRoles = (userId: string): Role[] => {
    const userRoleIds = userCustomRoles
      .filter(ucr => ucr.user_id === userId)
      .map(ucr => ucr.role_id);
    
    return roles.filter(r => userRoleIds.includes(r.id));
  };
  
  const hasPermission = (userId: string, permissionId: string): boolean => {
    const userRolesList = getUserRoles(userId);
    return userRolesList.some(role => role.permissions.includes(permissionId));
  };
  
  return (
    <RBACContext.Provider value={{
      users,
      roles,
      permissions,
      isLoading,
      addUser,
      updateUser,
      deleteUser,
      addRole,
      updateRole: updateRoleHandler,
      deleteRole: deleteRoleHandler,
      getUserRoles,
      hasPermission,
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider");
  }
  return context;
}
