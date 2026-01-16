import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = 'general_counsel' | 'legal_ops' | 'contract_counsel' | 'account_executive' | 'sales_manager' | 'finance_reviewer';
export type NeedsFilterType = "all" | "my-needs" | "team-queue" | "waiting-for";

export interface RoleInfo {
  id: string;
  name: string;
  displayName: string;
}

export interface NeedsFilterState {
  activeFilter: NeedsFilterType;
  setFilter: (filter: NeedsFilterType) => void;
  clearFilter: () => void;
  filterLabel: string | null;
  userRole: AppRole | null;
  satisfierRoleForFilter: string | null;
  teamRoleFilter: string | null;
  setTeamRoleFilter: (role: string | null) => void;
  // Unified role system values
  workRoutingRoleIds: string[];
  isManager: boolean;
  // Custom roles for display
  customRoles: RoleInfo[];
}

export function useNeedsFilter(): NeedsFilterState {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, customRoles: authCustomRoles, getWorkRoutingRoleIds, isManager } = useAuth();

  // Get work routing role IDs from the unified system
  const workRoutingRoleIds = useMemo(() => {
    return getWorkRoutingRoleIds();
  }, [getWorkRoutingRoleIds]);

  // Map custom roles to RoleInfo format for UI display
  const customRoles = useMemo((): RoleInfo[] => {
    if (!authCustomRoles) return [];
    return authCustomRoles
      .filter(r => r.is_work_routing)
      .map(r => ({
        id: r.id,
        name: r.name,
        displayName: r.display_name || r.name.replace(/_/g, " "),
      }));
  }, [authCustomRoles]);

  const activeFilter = useMemo(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "my-needs" || filterParam === "team-queue" || filterParam === "waiting-for") {
      return filterParam as NeedsFilterType;
    }
    return "all";
  }, [searchParams]);

  const teamRoleFilter = useMemo(() => {
    return searchParams.get("teamRole");
  }, [searchParams]);

  const setFilter = useCallback((filter: NeedsFilterType) => {
    const newParams = new URLSearchParams(searchParams);
    if (filter === "all") {
      newParams.delete("filter");
      newParams.delete("teamRole");
    } else {
      newParams.set("filter", filter);
      // Clear team role filter when switching away from team-queue
      if (filter !== "team-queue") {
        newParams.delete("teamRole");
      }
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const setTeamRoleFilter = useCallback((teamRole: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (teamRole) {
      newParams.set("filter", "team-queue");
      newParams.set("teamRole", teamRole);
    } else {
      newParams.delete("teamRole");
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("filter");
    newParams.delete("teamRole");
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const filterLabel = useMemo(() => {
    if (teamRoleFilter) {
      // Try to find display name from custom roles
      const roleInfo = customRoles.find(r => r.id === teamRoleFilter || r.name === teamRoleFilter);
      const displayName = roleInfo?.displayName || teamRoleFilter.replace(/_/g, " ");
      return `Team Queue: ${displayName}`;
    }
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
  }, [activeFilter, teamRoleFilter, customRoles]);

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
    teamRoleFilter,
    setTeamRoleFilter,
    workRoutingRoleIds,
    isManager: isManager(),
    customRoles,
  };
}

/**
 * @deprecated Use workRoutingRoleIds from useNeedsFilter instead
 */
export function getTeamRolesForRole(role: AppRole): string[] {
  // Legacy hardcoded mapping - kept for backward compatibility
  const teamRolesForRole: Record<AppRole, string[]> = {
    general_counsel: ["contract_counsel", "legal_ops", "general_counsel"],
    legal_ops: ["contract_counsel", "legal_ops", "general_counsel"],
    contract_counsel: ["contract_counsel", "legal_ops", "general_counsel"],
    account_executive: ["account_executive", "sales_manager"],
    sales_manager: ["account_executive", "sales_manager"],
    finance_reviewer: ["finance_reviewer"],
  };
  return teamRolesForRole[role] || [];
}

/**
 * @deprecated Use satisfierRoleForFilter from useNeedsFilter instead
 */
export function getSatisfierRole(role: AppRole): string {
  return role;
}
