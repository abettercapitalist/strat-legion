import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Copy, Archive, Eye, FolderOpen, Trash2, Upload, ChevronDown, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadModal } from "@/components/templates/DocumentUploadModal";

export default function Templates() {
  const { templates, drafts, loading, error, refresh, deleteTemplate: deleteTemplateFn, createTemplate } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedWorkstreamType, setSelectedWorkstreamType] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique categories from actual template data
  const categories = useMemo(() => {
    const allTemplates = [...templates, ...drafts];
    const uniqueCategories = [...new Set(allTemplates.map(t => t.category))];
    return ["All", ...uniqueCategories.sort()];
  }, [templates, drafts]);

  // Derive unique workstream types from actual template data
  const workstreamTypes = useMemo(() => {
    const allTemplates = [...templates, ...drafts];
    const uniqueTypes = [...new Set(allTemplates.map(t => t.workstream_type_name).filter(Boolean))];
    return ["All", ...uniqueTypes.sort()];
  }, [templates, drafts]);

  // Group templates by workstream type
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, Template[]> = {};
    
    templates.forEach(t => {
      const groupName = t.workstream_type_name || "General Templates";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(t);
    });

    // Sort groups: named workstream types first, then "General Templates"
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      if (a === "General Templates") return 1;
      if (b === "General Templates") return -1;
      return a.localeCompare(b);
    });

    return sortedGroups;
  }, [templates]);

  const handleImportTemplate = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string || "";
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        
        try {
          await createTemplate(nameWithoutExt, content, "Sales", "Draft");
          
          toast({
            title: "Template imported",
            description: `"${nameWithoutExt}" has been imported as a draft.`,
          });
        } catch (err) {
          toast({
            title: "Import failed",
            description: "Could not import the template. Please try again.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteTemplateFn(id);
      toast({
        title: "Template deleted",
        description: `"${name}" has been removed.`,
      });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: "Could not delete the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filterTemplates = (items: Template[]) => {
    return items.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      const matchesWorkstreamType = selectedWorkstreamType === "All" || 
        (t.workstream_type_name || "General Templates") === selectedWorkstreamType;
      return matchesSearch && matchesCategory && matchesWorkstreamType;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const TemplateTable = ({ items, showDraftActions = false }: { items: Template[], showDraftActions?: boolean }) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/30">
          <tr className="text-left text-sm text-muted-foreground">
            <th className="px-6 py-4 font-medium">Name</th>
            <th className="px-6 py-4 font-medium">Category</th>
            <th className="px-6 py-4 font-medium">Version</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Last Modified</th>
            <th className="px-6 py-4 font-medium w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No templates found</p>
              </td>
            </tr>
          ) : (
            items.map((template) => (
              <tr key={template.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <Link
                    to={`/law/templates/${template.id}/edit`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {template.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-muted">
                    {template.category}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                  {template.version}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant="outline"
                    className={
                      template.status === "Active"
                        ? "bg-status-success/10 text-status-success border-status-success/20"
                        : template.status === "Draft"
                        ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {template.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatDate(template.updated_at)}
                </td>
                <td className="px-6 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Usage
                      </DropdownMenuItem>
                      {showDraftActions && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(template.id, template.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                      {!showDraftActions && (
                        <DropdownMenuItem className="text-destructive">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-border rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2].map(j => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <FolderOpen className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium mb-2">Failed to load templates</h3>
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={refresh} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );

  // Filter grouped templates based on search and category
  const filteredGroupedTemplates = useMemo(() => {
    return groupedTemplates.map(([groupName, items]) => {
      const filtered = filterTemplates(items);
      return [groupName, filtered] as [string, Template[]];
    }).filter(([_, items]) => items.length > 0);
  }, [groupedTemplates, searchQuery, selectedCategory, selectedWorkstreamType]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage contract templates and their configurations
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".docx,.doc,.rtf,.pdf,.txt"
          className="hidden"
        />
        <DropdownMenu>
          <div className="flex">
            <Button asChild className="rounded-r-none">
              <Link to="/law/templates/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Template
              </Link>
            </Button>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-l-none border-l border-primary-foreground/20 px-2">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => setShowUploadModal(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Import with AI Parsing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportTemplate}>
              <Upload className="h-4 w-4 mr-2" />
              Import Raw File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DocumentUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSuccess={refresh}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center mr-2">Category:</span>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            {workstreamTypes.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground self-center mr-2">Workstream:</span>
                {workstreamTypes.map((type) => (
                  <Button
                    key={type || "general"}
                    variant={type === selectedWorkstreamType ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWorkstreamType(type || "All")}
                  >
                    {type || "General"}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="grouped" className="w-full">
            <TabsList>
              <TabsTrigger value="grouped">By Workstream</TabsTrigger>
              <TabsTrigger value="all">All Templates ({templates.length})</TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grouped" className="mt-6">
              {filteredGroupedTemplates.length === 0 ? (
                <div className="border border-border rounded-lg px-6 py-12 text-center text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No templates found</p>
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={filteredGroupedTemplates.map(([name]) => name)} className="space-y-4">
                  {filteredGroupedTemplates.map(([groupName, items]) => (
                    <AccordionItem key={groupName} value={groupName} className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/20">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{groupName}</span>
                          <Badge variant="secondary">{items.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <TemplateTable items={items} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              <TemplateTable items={filterTemplates(templates)} />
            </TabsContent>
            
            <TabsContent value="drafts" className="mt-6">
              <TemplateTable items={filterTemplates(drafts)} showDraftActions />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
