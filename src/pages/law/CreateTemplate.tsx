import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, ChevronDown, History } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractEditor } from "@/components/editor";
import { SaveTemplateDialog, DialogMode } from "@/components/editor/SaveTemplateDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAutoSave } from "@/hooks/useAutoSave";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CreateTemplate() {
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("choice");

  const {
    lastSaved,
    versions,
    getDraftName,
    discardDraft,
    restoreVersion,
  } = useAutoSave({
    content,
    templateName,
  });

  const handleOpenDialog = (mode: DialogMode) => {
    setDialogMode(mode);
    setSaveDialogOpen(true);
  };

  const handleDiscard = () => {
    discardDraft();
    navigate("/law/templates");
  };

  const handleRestoreVersion = (versionId: string) => {
    const restoredContent = restoreVersion(versionId);
    if (restoredContent) {
      setContent(restoredContent);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/law/templates")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Create New Template</h1>
            <p className="text-sm text-muted-foreground">
              Design your contract template with the editor below
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Last saved {format(lastSaved, "h:mm a")}
            </span>
          )}

          {/* Version History */}
          {versions.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Version History</SheetTitle>
                  <SheetDescription>
                    Restore previous versions of your draft
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                      onClick={() => handleRestoreVersion(version.id)}
                    >
                      <p className="font-medium text-sm">{version.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(version.savedAt, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Button variant="outline" onClick={() => navigate("/law/templates")}>
            Cancel
          </Button>

          {/* Split Save Button */}
          <div className="flex">
            <Button
              className="rounded-r-none"
              onClick={() => handleOpenDialog("choice")}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={cn(
                    "rounded-l-none border-l border-primary-foreground/20 px-2"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenDialog("system")}>
                  Save as Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDialog("download")}>
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleOpenDialog("discard")}
                >
                  Discard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 pt-6 min-h-0">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Template Meta */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="templateName" className="sr-only">
                Template Name
              </Label>
              <Input
                id="templateName"
                placeholder="Template Name (e.g., Enterprise SaaS Agreement)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <div className="w-48">
              <Label htmlFor="category" className="sr-only">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Draft name indicator */}
          {!templateName && content && (
            <p className="text-xs text-muted-foreground mb-2">
              Saving as: {getDraftName(new Date())}
            </p>
          )}

          {/* WYSIWYG Editor */}
          <div className="flex-1 min-h-0">
            <ContractEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Clause Library Sidebar (placeholder) */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Clause Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Available clauses will appear here. Drag and drop to add to your template.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        templateName={templateName}
        templateContent={content}
        category={category}
        initialMode={dialogMode}
        onDiscard={handleDiscard}
      />
    </div>
  );
}
