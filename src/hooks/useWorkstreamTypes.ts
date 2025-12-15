import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WorkstreamType {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  status: string;
  team_category: string | null;
  required_documents: string[] | null;
  default_workflow: string | null;
  created_at: string;
  updated_at: string;
  active_workstreams_count?: number;
}

export interface WorkstreamTypeFilters {
  status?: string;
  team_category?: string;
}

export function useWorkstreamTypes(filters?: WorkstreamTypeFilters) {
  const queryClient = useQueryClient();

  const { data: workstreamTypes, isLoading, error } = useQuery({
    queryKey: ["workstream-types", filters],
    queryFn: async () => {
      let query = supabase
        .from("workstream_types")
        .select("*")
        .order("name", { ascending: true });

      if (filters?.status && filters.status !== "All") {
        query = query.eq("status", filters.status);
      }
      if (filters?.team_category && filters.team_category !== "All") {
        query = query.eq("team_category", filters.team_category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get active workstream counts for each type
      const typesWithCounts = await Promise.all(
        (data || []).map(async (type) => {
          const { count } = await supabase
            .from("workstreams")
            .select("*", { count: "exact", head: true })
            .eq("workstream_type_id", type.id);
          
          return {
            ...type,
            active_workstreams_count: count || 0,
          };
        })
      );

      return typesWithCounts as WorkstreamType[];
    },
  });

  const createWorkstreamType = useMutation({
    mutationFn: async (data: Partial<WorkstreamType> & { approval_template_id?: string | null }) => {
      const { data: result, error } = await supabase
        .from("workstream_types")
        .insert({
          name: data.name!,
          display_name: data.display_name,
          description: data.description,
          status: data.status || "Draft",
          team_category: data.team_category,
          required_documents: data.required_documents || [],
          default_workflow: data.default_workflow,
          approval_template_id: data.approval_template_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workstream-types"] });
    },
    onError: (error) => {
      toast({ title: "Failed to create workstream type", description: error.message, variant: "destructive" });
    },
  });

  const updateWorkstreamType = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WorkstreamType> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("workstream_types")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workstream-types"] });
      toast({ title: "Workstream type updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update workstream type", description: error.message, variant: "destructive" });
    },
  });

  const duplicateWorkstreamType = useMutation({
    mutationFn: async (id: string) => {
      const original = workstreamTypes?.find((t) => t.id === id);
      if (!original) throw new Error("Workstream type not found");

      const { data: result, error } = await supabase
        .from("workstream_types")
        .insert({
          name: `${original.name} (Copy)`,
          display_name: original.display_name ? `${original.display_name} (Copy)` : null,
          description: original.description,
          status: "Draft",
          team_category: original.team_category,
          required_documents: original.required_documents,
          default_workflow: original.default_workflow,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workstream-types"] });
      toast({ title: "Workstream type duplicated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to duplicate workstream type", description: error.message, variant: "destructive" });
    },
  });

  const archiveWorkstreamType = useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from("workstream_types")
        .update({ status: "Archived" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workstream-types"] });
      toast({ title: "Workstream type archived successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to archive workstream type", description: error.message, variant: "destructive" });
    },
  });

  return {
    workstreamTypes: workstreamTypes || [],
    isLoading,
    error,
    createWorkstreamType,
    updateWorkstreamType,
    duplicateWorkstreamType,
    archiveWorkstreamType,
  };
}
