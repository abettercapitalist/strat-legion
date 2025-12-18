import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovalRoute {
  id: string;
  position: number;
  route_name: string;
  route_type: string;
  approvers: {
    role: string;
    sla_hours?: number;
    is_required?: boolean;
  }[];
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  routes: ApprovalRoute[];
  routeCount: number;
  usedByCount: number;
  updatedAt: string;
}

export function useApprovalTemplates(filterActive: boolean = false) {
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query
      let query = supabase
        .from("approval_templates")
        .select("*");
      
      // Filter by status if requested
      if (filterActive) {
        query = query.eq("status", "active");
      }
      
      // Sort alphabetically by name
      query = query.order("name");

      const { data: templatesData, error: templatesError } = await query;

      if (templatesError) throw templatesError;

      // Fetch workstream_types to count usage
      const { data: workstreamTypes, error: workstreamError } = await supabase
        .from("workstream_types")
        .select("approval_template_id");

      if (workstreamError) throw workstreamError;

      // Count usage per template
      const usageCount = new Map<string, number>();
      workstreamTypes?.forEach((wt) => {
        if (wt.approval_template_id) {
          usageCount.set(
            wt.approval_template_id,
            (usageCount.get(wt.approval_template_id) || 0) + 1
          );
        }
      });

      const parsed: ApprovalTemplate[] = (templatesData || []).map((template) => {
        const sequence = template.approval_sequence as unknown;
        let routes: ApprovalRoute[] = [];
        
        // Parse routes from approval_sequence
        if (Array.isArray(sequence)) {
          // Check if it's the new routes format or legacy gate format
          if (sequence.length > 0 && 'route_name' in (sequence[0] as object)) {
            routes = sequence as ApprovalRoute[];
          } else {
            // Convert legacy gate format to routes
            const gatesMap = new Map<number, ApprovalRoute>();
            sequence.forEach((item: any) => {
              const gateNum = item.gate || item.position || 1;
              if (!gatesMap.has(gateNum)) {
                gatesMap.set(gateNum, {
                  id: `legacy-${gateNum}`,
                  position: gateNum,
                  route_name: item.gate_name || `Route ${gateNum}`,
                  route_type: 'approval',
                  approvers: [],
                });
              }
              const route = gatesMap.get(gateNum)!;
              route.approvers.push({
                role: item.approver_role,
                sla_hours: item.sla_hours,
                is_required: true,
              });
            });
            routes = Array.from(gatesMap.values()).sort((a, b) => a.position - b.position);
          }
        }

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          status: template.status || "draft",
          routes,
          routeCount: routes.length,
          usedByCount: usageCount.get(template.id) || 0,
          updatedAt: template.updated_at,
        };
      });

      setTemplates(parsed);
      setError(null);
    } catch (err) {
      console.error("Error fetching approval routes:", err);
      setError("Failed to load approval routes");
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
