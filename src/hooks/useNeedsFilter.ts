import { useSearchParams, useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useUser, type UserRole } from "@/contexts/UserContext";

export type NeedsFilterType = "all" | "my-needs" | "team-queue" | "waiting-for";

export interface NeedsFilterState {
  activeFilter: NeedsFilterType;
  setFilter: (filter: NeedsFilterType) => void;
  clearFilter: () => void;
  filterLabel: string | null;
  userRole: UserRole | null;
  satisfierRoleForFilter: string | null;
}

// Map user roles to satisfier_role values used in the needs table
const roleToSatisfierRole: Record<UserRole, string> = {
  law: "contract_counsel",
  "legal-ops": "legal_ops",
  sales: "account_executive",
  manager: "sales_manager",
  finance: "finance_reviewer",
};

// Team roles that are "your team" for each user role
const teamRolesForUser: Record<UserRole, string[]> = {
  law: ["contract_counsel", "legal_ops", "general_counsel"],
  "legal-ops": ["contract_counsel", "legal_ops", "general_counsel"],
  sales: ["account_executive", "sales_manager"],
  manager: ["account_executive", "sales_manager"],
  finance: ["finance_reviewer"],
};

export function useNeedsFilter(): NeedsFilterState {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();

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

  const satisfierRoleForFilter = useMemo(() => {
    if (!user) return null;
    return roleToSatisfierRole[user.role] || null;
  }, [user]);

  return {
    activeFilter,
    setFilter,
    clearFilter,
    filterLabel,
    userRole: user?.role || null,
    satisfierRoleForFilter,
  };
}

// Helper to get team roles for a given user role
export function getTeamRolesForUser(userRole: UserRole): string[] {
  return teamRolesForUser[userRole] || [];
}

// Helper to get satisfier role from user role
export function getSatisfierRole(userRole: UserRole): string {
  return roleToSatisfierRole[userRole] || userRole;
}
