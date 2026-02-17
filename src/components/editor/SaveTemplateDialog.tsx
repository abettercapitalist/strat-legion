import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Folder, 
  FolderOpen, 
  Download, 
  HardDrive,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export type DialogMode = "choice" | "system" | "download" | "discard" | "draft-saved";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  templateContent: string;
  category: string;
  templateId?: string;
  isEditMode?: boolean;
  initialMode?: DialogMode;
  onDiscard?: () => void;
  draftName?: string;
  onSaveComplete?: () => void;
}

interface FolderItem {
  id: string;
  name: string;
  children?: FolderItem[];
}

const systemFolders: FolderItem[] = [
  {
    id: "drafts",
    name: "Drafts",
    children: [],
  },
  {
    id: "sales",
    name: "Sales",
    children: [
      { id: "sales-enterprise", name: "Enterprise" },
      { id: "sales-smb", name: "SMB" },
      { id: "sales-channel", name: "Channel Partners" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    children: [
      { id: "finance-billing", name: "Billing" },
      { id: "finance-procurement", name: "Procurement" },
    ],
  },
  {
    id: "regulatory",
    name: "Regulatory",
    children: [
      { id: "regulatory-compliance", name: "Compliance" },
      { id: "regulatory-privacy", name: "Privacy" },
    ],
  },
  {
    id: "hr",
    name: "Human Resources",
    children: [
      { id: "hr-employment", name: "Employment" },
      { id: "hr-contractors", name: "Contractors" },
    ],
  },
  {
    id: "partnerships",
    name: "Partnerships",
    children: [
      { id: "partnerships-strategic", name: "Strategic" },
      { id: "partnerships-integration", name: "Integration" },
    ],
  },
];

// File type configurations
const fileTypes = [
  { value: "docx", label: "Word Document (.docx)", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { value: "pdf", label: "PDF Document (.pdf)", mime: "application/pdf" },
];

function FolderTree({
  folders,
  selectedFolder,
  onSelect,
  level = 0,
}: {
  folders: FolderItem[];
  selectedFolder: string | null;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["drafts", "sales"]));

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  return (
    <div className="space-y-1">
      {folders.map((folder) => {
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expanded.has(folder.id);
        const isSelected = selectedFolder === folder.id;
        const isDrafts = folder.id === "drafts";

        return (
          <div key={folder.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                isDrafts && !isSelected && "text-muted-foreground"
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                onSelect(folder.id);
                if (hasChildren) toggleExpand(folder.id);
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )
              ) : (
                <span className="w-4" />
              )}
              {isExpanded && hasChildren ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm truncate">{folder.name}</span>
            </div>
            {hasChildren && isExpanded && (
              <FolderTree
                folders={folder.children!}
                selectedFolder={selectedFolder}
                onSelect={onSelect}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  templateName,
  templateContent,
  category,
  templateId,
  isEditMode = false,
  initialMode = "choice",
  onDiscard,
  draftName,
  onSaveComplete,
}: SaveTemplateDialogProps) {
  const [mode, setMode] = useState<DialogMode>(initialMode);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(
    category || "sales"
  );
  const [selectedFileType, setSelectedFileType] = useState("docx");
  const [savedDraftName, setSavedDraftName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Reset mode when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setMode(initialMode);
      setSelectedFolder(category || "sales");
      setSelectedFileType("docx");
    }
    onOpenChange(newOpen);
  };

  const handleSaveToSystem = async () => {
    setIsSaving(true);
    try {
      const name = templateName || draftName || "Untitled Template";
      
      if (isEditMode && templateId) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update({
            name,
            content: templateContent,
            category: category || "General",
            status: "Active",
          })
          .eq('id', templateId);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('templates')
          .insert({
            name,
            content: templateContent,
            category: category || "General",
            status: "Active",
          });

        if (error) throw error;
      }
      
      toast({
        title: "Template saved",
        description: `"${name}" has been saved successfully.`,
      });
      
      onSaveComplete?.();
      handleOpenChange(false);
      navigate("/law/templates");
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: "Save failed",
        description: "Could not save the template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const name = templateName || draftName || "Untitled Draft";
      
      if (isEditMode && templateId) {
        const { error } = await supabase
          .from('templates')
          .update({
            name,
            content: templateContent,
            category: category || "General",
            status: "Draft",
          })
          .eq('id', templateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('templates')
          .insert({
            name,
            content: templateContent,
            category: category || "General",
            status: "Draft",
          });

        if (error) throw error;
      }
      
      setSavedDraftName(name);
      setMode("draft-saved");
    } catch (err) {
      console.error('Save draft error:', err);
      toast({
        title: "Save failed",
        description: "Could not save the draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    const baseName = templateName || "untitled-template";
    const format = selectedFileType as "docx" | "pdf";

    setIsExporting(true);
    try {
      // Call edge function for real DOCX/PDF conversion
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "export-template",
        { body: { html: templateContent, format, filename: baseName } }
      );

      if (fnError) throw new Error(fnError.message);
      if (!result?.data) throw new Error("No data returned from export");

      // Decode base64 response to binary
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: result.content_type });
      const fileName = result.filename;

      // Try File System Access API for native save dialog
      if ("showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: `${format.toUpperCase()} Document`,
                accept: { [result.content_type]: [`.${format}`] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();

          toast({
            title: "Template downloaded",
            description: `"${fileName}" has been saved to your computer.`,
          });
          handleOpenChange(false);
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }

      // Fallback: direct download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Template downloaded",
        description: `"${fileName}" has been saved to your computer.`,
      });
      handleOpenChange(false);
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export failed",
        description: "Could not generate the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDiscard = () => {
    onDiscard?.();
    toast({
      title: "Draft discarded",
      description: "The draft has been permanently deleted.",
      variant: "destructive",
    });
    handleOpenChange(false);
  };

  // Render based on mode
  const renderContent = () => {
    switch (mode) {
      case "draft-saved":
        return (
          <>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle>Draft Saved</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-sm text-primary font-medium">
                {savedDraftName}
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => handleOpenChange(false)}>
                OK
              </Button>
            </DialogFooter>
          </>
        );

      case "discard":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Discard Draft
              </DialogTitle>
              <DialogDescription>
                Are you sure? Discarded drafts are unrecoverable.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="default"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDiscard}
              >
                Delete
              </Button>
            </DialogFooter>
          </>
        );

      case "download":
        const showBackInDownload = initialMode === "choice";
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {showBackInDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMode("choice")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <DialogTitle>Download Template</DialogTitle>
                  <DialogDescription>
                    Save "{templateName || "Untitled Template"}" to your computer
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileType">File Format</Label>
                <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                  <SelectTrigger id="fileType">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedFileType === "pdf"
                  ? "PDF is best for final documents. It cannot be easily edited."
                  : "This format can be edited in compatible word processors."
                }
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => showBackInDownload ? setMode("choice") : handleOpenChange(false)} disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={handleDownload} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case "system":
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMode("choice")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Save to System</DialogTitle>
                  <DialogDescription>
                    Choose a folder for "{templateName || "Untitled Template"}"
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <Label className="text-sm font-medium">Select folder</Label>
              <div className="border rounded-md p-2 mt-2 max-h-[250px] overflow-y-auto bg-muted/30">
                <FolderTree
                  folders={systemFolders}
                  selectedFolder={selectedFolder}
                  onSelect={setSelectedFolder}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("choice")} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveToSystem} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </>
        );

      default: // "choice"
        return (
          <>
            <DialogHeader>
              <DialogTitle>Save Template</DialogTitle>
              <DialogDescription>
                Choose where to save "{templateName || "Untitled Template"}"
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  "border-primary bg-primary/5 hover:bg-primary/10"
                )}
                onClick={() => setMode("system")}
              >
                <HardDrive className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Save to System</span>
                <span className="text-xs text-muted-foreground text-center">
                  Store in Playbook for collaboration
                </span>
              </button>
              <button
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  "border-border hover:border-muted-foreground/50"
                )}
                onClick={() => setMode("download")}
              >
                <Download className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Download</span>
                <span className="text-xs text-muted-foreground text-center">
                  Save to your computer
                </span>
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

// Export a function to trigger draft save directly
export function useSaveDraft() {
  const { toast } = useToast();
  
  const saveDraft = (name: string) => {
    // In a real app, this would save to the backend
    toast({
      title: "Draft Saved",
      description: name,
    });
    return true;
  };
  
  return { saveDraft };
}