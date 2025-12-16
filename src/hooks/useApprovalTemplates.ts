import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ApprovalGate {
  gate: number;
  gate_name: string;
  approver_role: string;
  sla_hours?: number;
  description?: string;
  condition?: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  gates: {
    name: string;
    approvers: {
      role: string;
      sla: string;
      conditional?: string;
    }[];
  }[];
  gateCount: number;
  usedByCount: number;
  updatedAt: string;
}

export function useApprovalTemplates() {
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("approval_templates")
        .select("*")
        .order("name");

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
        const sequence = (template.approval_sequence as unknown) as ApprovalGate[];
        
        // Group by gate number
        const gatesMap = new Map<number, { name: string; approvers: { role: string; sla: string; conditional?: string }[] }>();
        
        if (Array.isArray(sequence)) {
          sequence.forEach((item) => {
            const gateNum = item.gate;
            if (!gatesMap.has(gateNum)) {
              gatesMap.set(gateNum, {
                name: item.gate_name || `Gate ${gateNum}`,
                approvers: [],
              });
            }
            
            const gate = gatesMap.get(gateNum)!;
            gate.approvers.push({
              role: item.approver_role,
              sla: item.sla_hours ? `${item.sla_hours} hours` : "No SLA",
              conditional: item.condition,
            });
          });
        }

        const gates = Array.from(gatesMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([, gate]) => gate);

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          status: template.status || "draft",
          gates,
          gateCount: gates.length,
          usedByCount: usageCount.get(template.id) || 0,
          updatedAt: template.updated_at,
        };
      });

      setTemplates(parsed);
      setError(null);
    } catch (err) {
      console.error("Error fetching approval templates:", err);
      setError("Failed to load approval templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
