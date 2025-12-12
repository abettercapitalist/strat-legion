import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Clause {
  id: string;
  title: string;
  category: string;
  text: string;
  risk_level: string;
  is_standard: boolean;
  business_context: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClauseAlternative {
  id: string;
  clause_id: string;
  alternative_text: string;
  use_case: string | null;
  business_impact: string | null;
  created_at: string;
}

export function useClauses() {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClauses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clauses')
        .select('*')
        .order('title', { ascending: true });

      if (fetchError) throw fetchError;

      setClauses(data || []);
    } catch (err) {
      console.error('Error fetching clauses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clauses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClauses();
  }, [fetchClauses]);

  const createClause = async (
    clause: Omit<Clause, 'id' | 'created_at' | 'updated_at' | 'created_by'>
  ): Promise<Clause | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('clauses')
        .insert({
          ...clause,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchClauses();
      return data;
    } catch (err) {
      console.error('Error creating clause:', err);
      throw err;
    }
  };

  const createClausesBatch = async (
    clausesData: Omit<Clause, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]
  ): Promise<Clause[]> => {
    try {
      const { data, error: insertError } = await supabase
        .from('clauses')
        .insert(
          clausesData.map(c => ({
            ...c,
            created_by: user?.id || null,
          }))
        )
        .select();

      if (insertError) throw insertError;

      await fetchClauses();
      return data || [];
    } catch (err) {
      console.error('Error creating clauses batch:', err);
      throw err;
    }
  };

  const updateClause = async (
    id: string,
    updates: Partial<Pick<Clause, 'title' | 'category' | 'text' | 'risk_level' | 'is_standard' | 'business_context'>>
  ): Promise<Clause | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('clauses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchClauses();
      return data;
    } catch (err) {
      console.error('Error updating clause:', err);
      throw err;
    }
  };

  const deleteClause = async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('clauses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchClauses();
    } catch (err) {
      console.error('Error deleting clause:', err);
      throw err;
    }
  };

  const getClauseById = async (id: string): Promise<Clause | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clauses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('Error fetching clause:', err);
      return null;
    }
  };

  const getClauseAlternatives = async (clauseId: string): Promise<ClauseAlternative[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clause_alternatives')
        .select('*')
        .eq('clause_id', clauseId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching clause alternatives:', err);
      return [];
    }
  };

  return {
    clauses,
    loading,
    error,
    refresh: fetchClauses,
    createClause,
    createClausesBatch,
    updateClause,
    deleteClause,
    getClauseById,
    getClauseAlternatives,
  };
}
