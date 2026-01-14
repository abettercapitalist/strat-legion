import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Team {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  created_by: string | null;
}

export interface CreateTeamInput {
  name: string;
  display_name: string;
  description?: string;
}

export function useTeams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Team[];
    },
  });

  const createTeam = useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: input.name,
          display_name: input.display_name,
          description: input.description || null,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({
        title: "Team created",
        description: `${newTeam.display_name} has been added successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    teams,
    isLoading,
    error,
    createTeam,
  };
}
