import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface CustomRole {
  id: string;
  name: string;
  display_name: string | null;
  is_manager_role: boolean;
  is_work_routing: boolean;
  parent_id: string | null;
}

interface UseCurrentUserRoleResult {
  role: AppRole | null; // Legacy role for backward compatibility
  customRoles: CustomRole[]; // New: user's custom roles
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  // Helper functions
  isManager: boolean;
  workRoutingRoleIds: string[];
  hasRole: (roleId: string) => boolean;
}

/**
 * Hook to get the current authenticated user's role from both legacy and unified systems
 */
export function useCurrentUserRole(): UseCurrentUserRoleResult {
  const [role, setRole] = useState<AppRole | null>(null);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserRoles = useCallback(async (uid: string) => {
    try {
      // Fetch legacy role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();

      if (!roleError && roleData) {
        setRole(roleData.role);
      }

      // Fetch custom roles (unified system)
      const { data: userCustomRoles, error: customError } = await supabase
        .from("user_custom_roles")
        .select(`
          role_id,
          custom_roles (
            id,
            name,
            display_name,
            is_manager_role,
            is_work_routing,
            parent_id
          )
        `)
        .eq("user_id", uid);

      if (!customError && userCustomRoles) {
        const roles = userCustomRoles
          .map((ucr: any) => ucr.custom_roles)
          .filter((r: any): r is CustomRole => r !== null);
        setCustomRoles(roles);
      }
    } catch (err) {
      console.error("Error in useCurrentUserRole:", err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthenticated(false);
        setRole(null);
        setCustomRoles([]);
        setUserId(null);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setUserId(user.id);
      await fetchUserRoles(user.id);
      setIsLoading(false);
    };

    fetchData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        fetchUserRoles(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setRole(null);
        setCustomRoles([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRoles]);

  // Computed values
  const isManager = useMemo(() => {
    return customRoles.some(r => r.is_manager_role);
  }, [customRoles]);

  const workRoutingRoleIds = useMemo(() => {
    return customRoles
      .filter(r => r.is_work_routing)
      .map(r => r.id);
  }, [customRoles]);

  const hasRole = useCallback((roleId: string) => {
    return customRoles.some(r => r.id === roleId);
  }, [customRoles]);

  return { 
    role, 
    customRoles,
    isLoading, 
    isAuthenticated, 
    userId,
    isManager,
    workRoutingRoleIds,
    hasRole,
  };
}

/**
 * Map app_role to team roles for the UnifiedNeedsDashboard
 * @deprecated Use workRoutingRoleIds from useCurrentUserRole instead
 */
export function getTeamRolesForUser(role: AppRole | null): string[] {
  // Legacy mapping - kept for backward compatibility during transition
  switch (role) {
    case "general_counsel":
    case "legal_ops":
    case "contract_counsel":
      return ["general_counsel", "legal_ops", "contract_counsel"];
    case "account_executive":
    case "sales_manager":
    case "finance_reviewer":
      return ["account_executive", "sales_manager", "finance_reviewer"];
    default:
      return [];
  }
}
