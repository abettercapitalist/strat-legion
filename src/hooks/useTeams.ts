import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useCallback } from "react";

export interface Team {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  created_by: string | null;
  parent_id: string | null;
}

export interface CreateTeamInput {
  name: string;
  display_name: string;
  description?: string;
  parent_id?: string | null;
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
          parent_id: input.parent_id || null,
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

  // Helper: Get all parent teams (teams with no parent_id)
  const getParentTeams = useCallback(() => {
    return teams.filter((team) => !team.parent_id);
  }, [teams]);

  // Helper: Get sub-groups for a specific parent team
  const getSubgroups = useCallback(
    (parentId: string) => {
      return teams.filter((team) => team.parent_id === parentId);
    },
    [teams]
  );

  // Helper: Check if a team has sub-groups
  const hasSubgroups = useCallback(
    (teamId: string) => {
      return teams.some((team) => team.parent_id === teamId);
    },
    [teams]
  );

  // Helper: Get the full path for a team (e.g., "Sales > Inside Sales")
  const getTeamPath = useCallback(
    (teamId: string): string => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return "";

      if (team.parent_id) {
        const parent = teams.find((t) => t.id === team.parent_id);
        if (parent) {
          return `${parent.display_name} > ${team.display_name}`;
        }
      }
      return team.display_name;
    },
    [teams]
  );

  // Helper: Get team by ID
  const getTeamById = useCallback(
    (teamId: string) => {
      return teams.find((t) => t.id === teamId);
    },
    [teams]
  );

  // Organized hierarchy for display
  const teamHierarchy = useMemo(() => {
    const parentTeams = teams.filter((t) => !t.parent_id);
    return parentTeams.map((parent) => ({
      parent,
      subgroups: teams.filter((t) => t.parent_id === parent.id),
    }));
  }, [teams]);

  return {
    teams,
    teamHierarchy,
    isLoading,
    error,
    createTeam,
    getParentTeams,
    getSubgroups,
    hasSubgroups,
    getTeamPath,
    getTeamById,
  };
}
