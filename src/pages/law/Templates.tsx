import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Copy, Archive, Eye, FolderOpen, Trash2, Upload, ChevronDown, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllTemplates, getActiveTemplates, getDraftTemplates, deleteTemplate, saveDraft, MockTemplate } from "@/lib/mockFileSystem";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadModal } from "@/components/templates/DocumentUploadModal";

const categories = ["All", "Sales", "Procurement", "Employment", "Services", "Partnership"];

export default function Templates() {
  const [templates, setTemplates] = useState<MockTemplate[]>([]);
  const [drafts, setDrafts] = useState<MockTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTemplate = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string || "";
        // Extract name without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        
        // Save as draft
        saveDraft(nameWithoutExt, content, "Sales");
        refreshTemplates();
        
        toast({
          title: "Template imported",
          description: `"${nameWithoutExt}" has been imported as a draft.`,
        });
      };
      reader.readAsText(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  useEffect(() => {
    // Load templates from mock file system
    setTemplates(getActiveTemplates());
    setDrafts(getDraftTemplates());
  }, []);

  const refreshTemplates = () => {
    setTemplates(getActiveTemplates());
    setDrafts(getDraftTemplates());
  };

  const handleDelete = (id: string, name: string) => {
    deleteTemplate(id);
    refreshTemplates();
    toast({
      title: "Template deleted",
      description: `"${name}" has been removed.`,
    });
  };

  const filterTemplates = (items: MockTemplate[]) => {
    return items.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const TemplateTable = ({ items, showDraftActions = false }: { items: MockTemplate[], showDraftActions?: boolean }) => (
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
                  {template.lastModified}
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
        onSuccess={refreshTemplates}
      />

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
        <div className="flex gap-2">
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
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <TemplateTable items={filterTemplates(templates)} />
        </TabsContent>
        <TabsContent value="drafts" className="mt-6">
          <TemplateTable items={filterTemplates(drafts)} showDraftActions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
