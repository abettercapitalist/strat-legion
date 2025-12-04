// Mock file system using localStorage for prototype persistence
import { format } from "date-fns";

export interface MockTemplate {
  id: string;
  name: string;
  category: "Sales" | "Procurement" | "Employment" | "Services" | "Partnership";
  version: string;
  status: "Active" | "Draft" | "Archived";
  lastModified: string;
  content?: string;
  createdBy?: string;
}

const STORAGE_KEY = "playbook-templates";

// Default templates that always exist
const defaultTemplates: MockTemplate[] = [
  {
    id: "default-1",
    name: "Framework Agreement",
    category: "Sales",
    version: "v2.1",
    status: "Active",
    lastModified: "2025-11-10",
    createdBy: "sarah.chen@testco.com",
  },
  {
    id: "default-2",
    name: "Mutual NDA",
    category: "Sales",
    version: "v1.0",
    status: "Active",
    lastModified: "2025-11-08",
    createdBy: "sarah.chen@testco.com",
  },
  {
    id: "default-3",
    name: "Enterprise SaaS Agreement",
    category: "Sales",
    version: "v3.0",
    status: "Active",
    lastModified: "2025-11-05",
    createdBy: "sarah.chen@testco.com",
  },
  {
    id: "default-4",
    name: "Professional Services Agreement",
    category: "Services",
    version: "v1.2",
    status: "Active",
    lastModified: "2025-10-28",
    createdBy: "sarah.chen@testco.com",
  },
  {
    id: "default-5",
    name: "Master Vendor Agreement",
    category: "Procurement",
    version: "v1.0",
    status: "Active",
    lastModified: "2025-10-15",
    createdBy: "sarah.chen@testco.com",
  },
];

// Default drafts in the Drafts folder
const defaultDrafts: MockTemplate[] = [
  {
    id: "draft-default-1",
    name: "Untitled Draft - 2025 Nov 28",
    category: "Sales",
    version: "v0.1",
    status: "Draft",
    lastModified: "2025-11-28",
    createdBy: "sarah.chen@testco.com",
  },
  {
    id: "draft-default-2",
    name: "Partner Reseller Agreement",
    category: "Partnership",
    version: "v0.3",
    status: "Draft",
    lastModified: "2025-11-25",
    createdBy: "sarah.chen@testco.com",
  },
];

function getStoredTemplates(): MockTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading templates from localStorage:", e);
  }
  return [];
}

function saveTemplates(templates: MockTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("Error saving templates to localStorage:", e);
  }
}

// Initialize storage with defaults if empty
function initializeStorage(): void {
  const stored = getStoredTemplates();
  if (stored.length === 0) {
    saveTemplates([...defaultTemplates, ...defaultDrafts]);
  }
}

// Get all templates (defaults + user-created)
export function getAllTemplates(): MockTemplate[] {
  initializeStorage();
  return getStoredTemplates();
}

// Get only active templates (non-drafts)
export function getActiveTemplates(): MockTemplate[] {
  return getAllTemplates().filter(t => t.status === "Active");
}

// Get only drafts
export function getDraftTemplates(): MockTemplate[] {
  return getAllTemplates().filter(t => t.status === "Draft");
}

// Add a new template
export function addTemplate(template: Omit<MockTemplate, "id" | "lastModified">): MockTemplate {
  const templates = getAllTemplates();
  const newTemplate: MockTemplate = {
    ...template,
    id: `user-${Date.now()}`,
    lastModified: format(new Date(), "yyyy-MM-dd"),
  };
  templates.unshift(newTemplate);
  saveTemplates(templates);
  return newTemplate;
}

// Save a draft
export function saveDraft(name: string, content: string, category: MockTemplate["category"] = "Sales", createdBy?: string): MockTemplate {
  const templates = getAllTemplates();
  const now = new Date();
  
  // Check if draft with same name exists
  const existingIndex = templates.findIndex(t => t.name === name && t.status === "Draft");
  
  const draftTemplate: MockTemplate = {
    id: existingIndex >= 0 ? templates[existingIndex].id : `draft-${Date.now()}`,
    name,
    category,
    version: "v0.1",
    status: "Draft",
    lastModified: format(now, "yyyy-MM-dd"),
    content,
    createdBy,
  };
  
  if (existingIndex >= 0) {
    templates[existingIndex] = draftTemplate;
  } else {
    templates.unshift(draftTemplate);
  }
  
  saveTemplates(templates);
  return draftTemplate;
}

// Update an existing template
export function updateTemplate(id: string, updates: Partial<MockTemplate>): MockTemplate | null {
  const templates = getAllTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index >= 0) {
    templates[index] = {
      ...templates[index],
      ...updates,
      lastModified: format(new Date(), "yyyy-MM-dd"),
    };
    saveTemplates(templates);
    return templates[index];
  }
  
  return null;
}

// Delete a template
export function deleteTemplate(id: string): boolean {
  const templates = getAllTemplates();
  const filtered = templates.filter(t => t.id !== id);
  
  if (filtered.length !== templates.length) {
    saveTemplates(filtered);
    return true;
  }
  
  return false;
}

// Get a template by ID
export function getTemplateById(id: string): MockTemplate | null {
  return getAllTemplates().find(t => t.id === id) || null;
}

// Reset to defaults (useful for testing)
export function resetToDefaults(): void {
  saveTemplates([...defaultTemplates, ...defaultDrafts]);
}
