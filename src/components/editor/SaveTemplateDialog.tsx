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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Folder, 
  FolderOpen, 
  Download, 
  HardDrive,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  templateContent: string;
  category: string;
}

interface FolderItem {
  id: string;
  name: string;
  children?: FolderItem[];
}

const systemFolders: FolderItem[] = [
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["sales"]));

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

        return (
          <div key={folder.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
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
}: SaveTemplateDialogProps) {
  const [saveLocation, setSaveLocation] = useState<"system" | "local">("system");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(category || "sales");
  const { toast } = useToast();

  const handleSave = () => {
    if (saveLocation === "local") {
      // Download as HTML file
      const blob = new Blob([templateContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${templateName || "untitled-template"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Template downloaded",
        description: "The template has been saved to your computer.",
      });
    } else {
      // Save to system (mock)
      const folderName = systemFolders
        .flatMap((f) => [f, ...(f.children || [])])
        .find((f) => f.id === selectedFolder)?.name || "Unknown";
      
      toast({
        title: "Template saved",
        description: `"${templateName || "Untitled"}" saved to ${folderName}.`,
      });
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Template</DialogTitle>
          <DialogDescription>
            Choose where to save "{templateName || "Untitled Template"}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={saveLocation}
            onValueChange={(v) => setSaveLocation(v as "system" | "local")}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="system"
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                saveLocation === "system"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <RadioGroupItem value="system" id="system" className="sr-only" />
              <HardDrive className="h-8 w-8 text-muted-foreground" />
              <span className="font-medium">Save to System</span>
              <span className="text-xs text-muted-foreground text-center">
                Store in Playbook for collaboration
              </span>
            </Label>
            <Label
              htmlFor="local"
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                saveLocation === "local"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <RadioGroupItem value="local" id="local" className="sr-only" />
              <Download className="h-8 w-8 text-muted-foreground" />
              <span className="font-medium">Download</span>
              <span className="text-xs text-muted-foreground text-center">
                Save to your computer
              </span>
            </Label>
          </RadioGroup>

          {saveLocation === "system" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select folder</Label>
              <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto bg-muted/30">
                <FolderTree
                  folders={systemFolders}
                  selectedFolder={selectedFolder}
                  onSelect={setSelectedFolder}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {saveLocation === "system" ? "Save" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
