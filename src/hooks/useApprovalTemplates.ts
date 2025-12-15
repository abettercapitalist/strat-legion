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
  is_active: boolean;
  gates: {
    name: string;
    approvers: {
      role: string;
      sla: string;
      conditional?: string;
    }[];
  }[];
  gateCount: number;
}

export function useApprovalTemplates() {
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("approval_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (fetchError) throw fetchError;

      const parsed: ApprovalTemplate[] = (data || []).map((template) => {
        const sequence = (template.approval_sequence as unknown) as ApprovalGate[];
        
        // Group by gate number
        const gatesMap = new Map<number, { name: string; approvers: { role: string; sla: string; conditional?: string }[] }>();
        
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

        const gates = Array.from(gatesMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([, gate]) => gate);

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          is_active: template.is_active ?? true,
          gates,
          gateCount: gates.length,
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
