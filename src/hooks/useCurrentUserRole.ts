import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseCurrentUserRoleResult {
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

/**
 * Hook to get the current authenticated user's role from the user_roles table
 */
export function useCurrentUserRole(): UseCurrentUserRoleResult {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setRole(null);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserId(user.id);

        // Fetch role from user_roles table
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        } else {
          setRole(roleData?.role || null);
        }
      } catch (err) {
        console.error("Error in useCurrentUserRole:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        // Re-fetch role when auth state changes
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setRole(data?.role || null);
          });
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, isLoading, isAuthenticated, userId };
}

/**
 * Map app_role to team roles for the UnifiedNeedsDashboard
 */
export function getTeamRolesForUser(role: AppRole | null): string[] {
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
