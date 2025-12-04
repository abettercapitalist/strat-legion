import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { saveDraft as saveDraftToFileSystem } from "@/lib/mockFileSystem";

export interface DraftVersion {
  id: string;
  content: string;
  savedAt: Date;
  name: string;
}

interface AutoSaveOptions {
  content: string;
  templateName: string;
  autoSaveInterval?: number; // in ms, default 30 seconds
  versionInterval?: number; // in ms, default 3 minutes
  category?: "Sales" | "Procurement" | "Employment" | "Services" | "Partnership";
  userEmail?: string;
}

export function useAutoSave({
  content,
  templateName,
  autoSaveInterval = 30000, // 30 seconds (Google Docs standard)
  versionInterval = 180000, // 3 minutes for version history
  category = "Sales",
  userEmail,
}: AutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string>(() => 
    `draft-${Date.now()}`
  );
  const lastVersionContent = useRef<string>("");
  const isFirstRender = useRef(true);

  const getDraftName = useCallback((date: Date) => {
    if (templateName.trim()) {
      return templateName;
    }
    return `Untitled Draft - ${format(date, "yyyy MMM dd")}`;
  }, [templateName]);

  // Auto-save current draft
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!content.trim()) return;

    const timer = setTimeout(() => {
      const now = new Date();
      const draftName = getDraftName(now);
      
      // Save to mock file system (persists in localStorage)
      saveDraftToFileSystem(draftName, content, category, userEmail);
      setLastSaved(now);
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [content, getDraftName, autoSaveInterval, category, userEmail]);

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

  // Manual save - now saves to mock file system
  const saveDraft = useCallback(() => {
    const now = new Date();
    const draftName = getDraftName(now);
    
    // Save to mock file system (persists in localStorage)
    const savedTemplate = saveDraftToFileSystem(draftName, content, category, userEmail);
    setLastSaved(now);
    
    return {
      id: savedTemplate.id,
      name: savedTemplate.name,
      content,
      savedAt: now.toISOString(),
      templateName,
    };
  }, [content, getDraftName, templateName, category, userEmail]);

  // Discard draft
  const discardDraft = useCallback(() => {
    localStorage.removeItem(`playbook-draft-${currentDraftId}`);
    setLastSaved(null);
    setVersions([]);
  }, [currentDraftId]);

  // Restore to a specific version
  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.content || null;
  }, [versions]);

  return {
    lastSaved,
    versions,
    currentDraftId,
    getDraftName,
    saveDraft,
    discardDraft,
    restoreVersion,
  };
}
