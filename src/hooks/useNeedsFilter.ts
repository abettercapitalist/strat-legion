import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = 'general_counsel' | 'legal_ops' | 'contract_counsel' | 'account_executive' | 'sales_manager' | 'finance_reviewer';
export type NeedsFilterType = "all" | "my-needs" | "team-queue" | "waiting-for";

export interface NeedsFilterState {
  activeFilter: NeedsFilterType;
  setFilter: (filter: NeedsFilterType) => void;
  clearFilter: () => void;
  filterLabel: string | null;
  userRole: AppRole | null;
  satisfierRoleForFilter: string | null;
}

// Team roles that are "your team" for each user role
const teamRolesForRole: Record<AppRole, string[]> = {
  general_counsel: ["contract_counsel", "legal_ops", "general_counsel"],
  legal_ops: ["contract_counsel", "legal_ops", "general_counsel"],
  contract_counsel: ["contract_counsel", "legal_ops", "general_counsel"],
  account_executive: ["account_executive", "sales_manager"],
  sales_manager: ["account_executive", "sales_manager"],
  finance_reviewer: ["finance_reviewer"],
};

export function useNeedsFilter(): NeedsFilterState {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  const activeFilter = useMemo(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "my-needs" || filterParam === "team-queue" || filterParam === "waiting-for") {
      return filterParam as NeedsFilterType;
    }
    return "all";
  }, [searchParams]);

  const setFilter = useCallback((filter: NeedsFilterType) => {
    const newParams = new URLSearchParams(searchParams);
    if (filter === "all") {
      newParams.delete("filter");
    } else {
      newParams.set("filter", filter);
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("filter");
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case "my-needs":
        return "My Actions";
      case "team-queue":
        return "Team Queue";
      case "waiting-for":
        return "Waiting For";
      default:
        return null;
    }
  }, [activeFilter]);

  // Database roles already match satisfier_role values
  const satisfierRoleForFilter = useMemo(() => {
    return role || null;
  }, [role]);

  return {
    activeFilter,
    setFilter,
    clearFilter,
    filterLabel,
    userRole: role as AppRole | null,
    satisfierRoleForFilter,
  };
}

// Helper to get team roles for a given user role
export function getTeamRolesForRole(role: AppRole): string[] {
  return teamRolesForRole[role] || [];
}

// Helper to get satisfier role from user role (identity function since they match)
export function getSatisfierRole(role: AppRole): string {
  return role;
}
