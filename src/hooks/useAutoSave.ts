import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface DraftVersion {
  id: string;
  content: string;
  savedAt: Date;
  name: string;
}

interface AutoSaveOptions {
  content: string;
  templateName: string;
  templateId?: string;
  autoSaveInterval?: number; // in ms, default 30 seconds
  versionInterval?: number; // in ms, default 3 minutes
  category?: string;
}

export function useAutoSave({
  content,
  templateName,
  templateId,
  autoSaveInterval = 30000, // 30 seconds
  versionInterval = 180000, // 3 minutes for version history
  category = "General",
}: AutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const lastVersionContent = useRef<string>("");
  const lastSavedContent = useRef<string>("");
  const isFirstRender = useRef(true);

  const getDraftName = useCallback((date: Date) => {
    if (templateName.trim()) {
      return templateName;
    }
    return `Untitled Draft - ${format(date, "yyyy MMM dd")}`;
  }, [templateName]);

  // Auto-save to database when editing existing template
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedContent.current = content;
      return;
    }

    // Only auto-save if we have a template ID and content has changed
    if (!templateId || !content.trim() || content === lastSavedContent.current) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('templates')
          .update({
            content,
            name: templateName || getDraftName(new Date()),
          })
          .eq('id', templateId);

        if (!error) {
          setLastSaved(new Date());
          lastSavedContent.current = content;
        }
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [content, templateId, templateName, getDraftName, autoSaveInterval]);

  // Create version snapshots every versionInterval
  useEffect(() => {
    if (!content.trim() || content === lastVersionContent.current) return;

    const timer = setInterval(() => {
      if (content !== lastVersionContent.current && content.trim()) {
        const now = new Date();
        const newVersion: DraftVersion = {
          id: `version-${Date.now()}`,
          content,
          savedAt: now,
          name: getDraftName(now),
        };
        
        setVersions(prev => [...prev, newVersion]);
        lastVersionContent.current = content;
      }
    }, versionInterval);

    return () => clearInterval(timer);
  }, [content, getDraftName, versionInterval]);

  // Manual save to database
  const saveDraft = useCallback(async () => {
    if (!templateId) return null;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('templates')
        .update({
          content,
          name: templateName || getDraftName(new Date()),
          category,
          status: 'Draft',
        })
        .eq('id', templateId);

      if (error) throw error;

      const now = new Date();
      setLastSaved(now);
      lastSavedContent.current = content;

      return {
        id: templateId,
        name: templateName || getDraftName(now),
        content,
        savedAt: now.toISOString(),
      };
    } catch (err) {
      console.error('Save error:', err);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [content, templateId, templateName, getDraftName, category]);

  // Discard draft
  const discardDraft = useCallback(() => {
    setLastSaved(null);
    setVersions([]);
  }, []);

  // Restore to a specific version
  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.content || null;
  }, [versions]);

  return {
    lastSaved,
    versions,
    isSaving,
    getDraftName,
    saveDraft,
    discardDraft,
    restoreVersion,
  };
}
