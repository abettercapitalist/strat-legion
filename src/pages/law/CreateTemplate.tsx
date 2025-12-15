import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, ChevronDown, History, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContractEditor } from "@/components/editor";
import { SaveTemplateDialog, DialogMode } from "@/components/editor/SaveTemplateDialog";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useTemplates } from "@/hooks/useTemplates";
import { useClauses, Clause } from "@/hooks/useClauses";
import { ClauseLibrarySidebar } from "@/components/templates/ClauseLibrarySidebar";
import { ClauseMatchingModal } from "@/components/templates/ClauseMatchingModal";
import { extractClauseBlocks, findClauseMatches, ClauseBlock } from "@/lib/clauseMatching";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateTemplate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { getTemplateById, updateTemplate, createTemplate } = useTemplates();
  const { clauses, createClause } = useClauses();

  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("choice");
  const [draftSavedDialogOpen, setDraftSavedDialogOpen] = useState(false);
  const [savedDraftName, setSavedDraftName] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Clause matching state
  const [pendingBlocks, setPendingBlocks] = useState<ClauseBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [matchingModalOpen, setMatchingModalOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const {
    lastSaved,
    versions,
    isSaving: autoSaving,
    getDraftName,
    discardDraft,
    restoreVersion,
  } = useAutoSave({
    content,
    templateName,
    templateId: id,
    category,
  });

  // Load template data in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    
    let cancelled = false;
    setLoading(true);
    
    const loadTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (cancelled) return;
        
        if (error) throw error;
        
        if (data) {
          setTemplateName(data.name);
          setCategory(data.category);
          setContent(data.content || "");
        } else {
          toast.error("Template not found");
          navigate("/law/templates");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading template:", err);
          toast.error("Failed to load template");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    loadTemplate();
    
    return () => { cancelled = true; };
  }, [id, isEditMode, navigate]);

  const handleOpenDialog = (mode: DialogMode) => {
    setDialogMode(mode);
    setSaveDialogOpen(true);
  };

  const handleSaveAsDraft = async () => {
    const name = templateName || getDraftName(new Date());
    setSaving(true);

    try {
      if (isEditMode && id) {
        await updateTemplate(id, {
          name,
          content,
          category: category || "General",
          status: "Draft",
        });
      } else {
        await createTemplate(name, content, category || "General", "Draft");
      }
      setSavedDraftName(name);
      setDraftSavedDialogOpen(true);
    } catch (err) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
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

  // Insert clause into editor
  const handleInsertClause = useCallback((clause: Clause) => {
    const clauseHtml = `<p><strong>${clause.title}</strong></p><p>${clause.text}</p>`;
    setContent((prev) => prev + clauseHtml);
    toast.success(`Inserted "${clause.title}"`);
  }, []);

  // Run clause matching on content
  const runClauseMatching = useCallback(async () => {
    if (!content || clauses.length === 0) return;

    setIsMatching(true);
    try {
      // Extract clause blocks from content
      const blocks = extractClauseBlocks(content);
      
      if (blocks.length === 0) {
        toast.info("No clause sections detected in template");
        setIsMatching(false);
        return;
      }

      // Find matches for each block
      const blocksWithMatches: ClauseBlock[] = blocks.map((block) => {
        const matches = findClauseMatches(block.text, clauses, 75);
        return { ...block, matches };
      });

      // Filter to only blocks that need attention (not exact matches)
      const needsReview = blocksWithMatches.filter(
        (b) => !b.matches?.some((m) => m.matchType === "exact")
      );

      if (needsReview.length === 0) {
        toast.success("All clauses matched to library");
      } else {
        setPendingBlocks(needsReview);
        setCurrentBlockIndex(0);
        setMatchingModalOpen(true);
      }
    } catch (err) {
      console.error("Error matching clauses:", err);
      toast.error("Failed to analyze clauses");
    } finally {
      setIsMatching(false);
    }
  }, [content, clauses]);

  // Handle clause matching confirmations
  const handleConfirmMatch = async (blockIndex: number, clauseId: string) => {
    // Link clause to template via template_clauses table
    if (id) {
      try {
        await supabase.from("template_clauses").insert({
          template_id: id,
          clause_id: clauseId,
          position: blockIndex,
        });
        toast.success("Clause linked to template");
      } catch (err) {
        console.error("Error linking clause:", err);
      }
    }
    moveToNextBlock();
  };

  const handleAddAsAlternative = async (
    blockIndex: number,
    clauseId: string,
    alternativeText: string
  ) => {
    try {
      await supabase.from("clause_alternatives").insert({
        clause_id: clauseId,
        alternative_text: alternativeText,
        use_case: "Imported from template",
      });
      toast.success("Alternative added to clause library");
      
      // Also link to template
      if (id) {
        await supabase.from("template_clauses").insert({
          template_id: id,
          clause_id: clauseId,
          position: blockIndex,
        });
      }
    } catch (err) {
      console.error("Error adding alternative:", err);
      toast.error("Failed to add alternative");
    }
    moveToNextBlock();
  };

  const handleAddAsNew = async (
    blockIndex: number,
    clause: { title: string; category: string; text: string }
  ) => {
    try {
      const newClause = await createClause({
        title: clause.title,
        category: clause.category,
        text: clause.text,
        risk_level: "low",
        is_standard: true,
        business_context: null,
      });

      if (newClause && id) {
        await supabase.from("template_clauses").insert({
          template_id: id,
          clause_id: newClause.id,
          position: blockIndex,
        });
      }
      toast.success("New clause added to library");
    } catch (err) {
      console.error("Error creating clause:", err);
      toast.error("Failed to create clause");
    }
    moveToNextBlock();
  };

  const handleSkipBlock = (blockIndex: number) => {
    moveToNextBlock();
  };

  const moveToNextBlock = () => {
    if (currentBlockIndex < pendingBlocks.length - 1) {
      setCurrentBlockIndex((i) => i + 1);
      setMatchingModalOpen(true);
    } else {
      setMatchingModalOpen(false);
      setPendingBlocks([]);
      setCurrentBlockIndex(0);
      toast.success("Clause review complete");
    }
  };

  // Get unique categories for clause creation
  const clauseCategories = [...new Set(clauses.map((c) => c.category))];

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="flex-1 flex gap-6 pt-6">
          <div className="flex-1">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-[600px] w-full" />
          </div>
          <Skeleton className="w-80 h-full" />
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-semibold">
              {isEditMode ? "Edit Template" : "Create New Template"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? "Modify your contract template"
                : "Design your contract template with the editor below"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {autoSaving ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="text-xs text-muted-foreground">
              Last saved {format(lastSaved, "h:mm a")}
            </span>
          ) : null}

          {/* Analyze Clauses Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={runClauseMatching}
            disabled={isMatching || !content}
          >
            {isMatching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Match Clauses"
            )}
          </Button>

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
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? "Save Changes" : "Save Template"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={cn(
                    "rounded-l-none border-l border-primary-foreground/20 px-2"
                  )}
                  disabled={saving}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSaveAsDraft}>
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
              <Select
                value={category}
                onValueChange={(value) => {
                  if (value === "new") {
                    return;
                  }
                  setCategory(value);
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Template">Template</SelectItem>
                  <SelectItem value="new" className="text-primary font-medium">
                    New category...
                  </SelectItem>
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
          <div
            className="flex-1 min-h-0"
            onDrop={(e) => {
              e.preventDefault();
              try {
                const data = e.dataTransfer.getData("application/json");
                if (data) {
                  const clause = JSON.parse(data) as Clause;
                  handleInsertClause(clause);
                }
              } catch (err) {
                console.error("Drop error:", err);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <ContractEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Clause Library Sidebar */}
        <ClauseLibrarySidebar
          className="w-80 flex-shrink-0"
          onInsertClause={handleInsertClause}
        />
      </div>

      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        templateName={templateName}
        templateContent={content}
        category={category}
        templateId={id}
        isEditMode={isEditMode}
        initialMode={dialogMode}
        onDiscard={handleDiscard}
        draftName={getDraftName(new Date())}
        onSaveComplete={() => navigate("/law/templates")}
      />

      {/* Draft Saved Confirmation Dialog */}
      <Dialog open={draftSavedDialogOpen} onOpenChange={setDraftSavedDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Draft Saved</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              {savedDraftName}
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setDraftSavedDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clause Matching Modal */}
      <ClauseMatchingModal
        open={matchingModalOpen}
        onOpenChange={setMatchingModalOpen}
        block={pendingBlocks[currentBlockIndex] || null}
        onConfirmMatch={handleConfirmMatch}
        onAddAsAlternative={handleAddAsAlternative}
        onAddAsNew={handleAddAsNew}
        onSkip={handleSkipBlock}
        categories={clauseCategories}
      />
    </div>
  );
}
