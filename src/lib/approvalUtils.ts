/**
 * Approval workflow utilities for consistent terminology
 */

export interface ApprovalRoute {
  route_type?: string;
  custom_route_name?: string;
  position?: number;
  gate?: number;
  role?: string;
  approvers?: string[];
  threshold?: string;
  mode?: string;
}

/**
 * Humanize a route_type to a user-friendly label
 */
export function humanizeRouteType(routeType: string): string {
  const routeTypeMap: Record<string, string> = {
    pre_deal: "Pre-Deal Review",
    proposal: "Proposal Review",
    closing: "Closing Review",
    legal: "Legal Review",
    finance: "Finance Review",
    executive: "Executive Review",
    compliance: "Compliance Review",
    security: "Security Review",
    custom: "Custom Review",
  };

  return routeTypeMap[routeType] || routeType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the display name for a route at a given position in the sequence
 */
export function getRouteName(
  approvalSequence: ApprovalRoute[] | null | undefined,
  position: number
): string {
  if (!approvalSequence || !Array.isArray(approvalSequence)) {
    return `Route ${position}`;
  }

  // Find the route at the given position (1-indexed)
  const route = approvalSequence.find(
    (r) => (r.position || r.gate) === position
  );

  if (!route) {
    return `Route ${position}`;
  }

  // Prefer custom_route_name, then humanize route_type
  if (route.custom_route_name) {
    return route.custom_route_name;
  }

  if (route.route_type) {
    return humanizeRouteType(route.route_type);
  }

  // Fallback to role if available
  if (route.role) {
    return `${route.role} Review`;
  }

  return `Route ${position}`;
}

/**
 * Get the approver role display name for a route
 */
export function getRouteApproverRole(
  approvalSequence: ApprovalRoute[] | null | undefined,
  position: number
): string {
  if (!approvalSequence || !Array.isArray(approvalSequence)) {
    return "Approver";
  }

  const route = approvalSequence.find(
    (r) => (r.position || r.gate) === position
  );

  return route?.role || "Approver";
}
