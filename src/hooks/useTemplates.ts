import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Template {
  id: string;
  name: string;
  category: string;
  version: string;
  status: string;
  content: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  workstream_type_id: string | null;
  workstream_type_name: string | null;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [drafts, setDrafts] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('templates')
        .select('*, workstream_types(name)')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Flatten workstream type name into template object
      const allTemplates: Template[] = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        version: t.version,
        status: t.status,
        content: t.content,
        created_by: t.created_by,
        created_at: t.created_at,
        updated_at: t.updated_at,
        workstream_type_id: t.workstream_type_id,
        workstream_type_name: t.workstream_types?.name || null,
      }));

      setTemplates(allTemplates.filter(t => t.status !== 'Draft'));
      setDrafts(allTemplates.filter(t => t.status === 'Draft'));
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    name: string,
    content: string,
    category: string,
    status: 'Draft' | 'Active' = 'Draft'
  ): Promise<Template | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('templates')
        .insert({
          name,
          content,
          category,
          status,
          created_by: user?.id || null,
        })
        .select('*, workstream_types(name)')
        .single();

      if (insertError) throw insertError;

      await fetchTemplates();
      return {
        ...data,
        workstream_type_name: data.workstream_types?.name || null,
      };
    } catch (err) {
      console.error('Error creating template:', err);
      throw err;
    }
  };

  const updateTemplate = async (
    id: string,
    updates: Partial<Pick<Template, 'name' | 'content' | 'category' | 'status' | 'version' | 'workstream_type_id'>>
  ): Promise<Template | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', id)
        .select('*, workstream_types(name)')
        .single();

      if (updateError) throw updateError;

      await fetchTemplates();
      return {
        ...data,
        workstream_type_name: data.workstream_types?.name || null,
      };
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const getTemplateById = async (id: string): Promise<Template | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('templates')
        .select('*, workstream_types(name)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return {
        ...data,
        workstream_type_name: data.workstream_types?.name || null,
      };
    } catch (err) {
      console.error('Error fetching template:', err);
      return null;
    }
  };

  return {
    templates,
    drafts,
    loading,
    error,
    refresh: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
  };
}
