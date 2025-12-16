import { useState, useMemo } from "react";
import { Plus, Pencil, MoreHorizontal, Copy, Archive, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApprovalTemplates, ApprovalTemplate } from "@/hooks/useApprovalTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type SortField = "name" | "updatedAt";
type SortDirection = "asc" | "desc";

export default function ApprovalTemplates() {
  const { templates, loading, error, refetch } = useApprovalTemplates();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gatesFilter, setGatesFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredAndSortedTemplates = useMemo(() => {
    let result = [...templates];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Apply gates filter
    if (gatesFilter !== "all") {
      if (gatesFilter === "1") {
        result = result.filter((t) => t.gateCount === 1);
      } else if (gatesFilter === "2-3") {
        result = result.filter((t) => t.gateCount >= 2 && t.gateCount <= 3);
      } else if (gatesFilter === "4+") {
        result = result.filter((t) => t.gateCount >= 4);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "updatedAt") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [templates, statusFilter, gatesFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "archived":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Archived</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { error: insertError } = await supabase
        .from("approval_templates")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          approval_sequence: [],
          status: "draft",
        });

      if (insertError) throw insertError;

      toast.success("Approval template created");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
      refetch();
    } catch (err) {
      console.error("Error creating template:", err);
      toast.error("Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate || !formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("approval_templates")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })
        .eq("id", selectedTemplate.id);

      if (updateError) throw updateError;

      toast.success("Approval template updated");
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      setFormData({ name: "", description: "" });
      refetch();
    } catch (err) {
      console.error("Error updating template:", err);
      toast.error("Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (template: ApprovalTemplate) => {
    const newStatus = template.status === "archived" ? "draft" : "archived";
    const action = template.status === "archived" ? "restored" : "archived";

    try {
      const { error: updateError } = await supabase
        .from("approval_templates")
        .update({ status: newStatus })
        .eq("id", template.id);

      if (updateError) throw updateError;

      toast.success(`Approval template ${action}`);
      refetch();
    } catch (err) {
      console.error("Error archiving template:", err);
      toast.error("Failed to update template");
    }
  };

  const handleDuplicate = async (template: ApprovalTemplate) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("approval_templates")
        .select("*")
        .eq("id", template.id)
        .single();

      if (fetchError) throw fetchError;

      const { error: insertError } = await supabase
        .from("approval_templates")
        .insert({
          name: `${data.name} (Copy)`,
          description: data.description,
          approval_sequence: data.approval_sequence,
          trigger_conditions: data.trigger_conditions,
          status: "draft",
        });

      if (insertError) throw insertError;

      toast.success("Approval template duplicated");
      refetch();
    } catch (err) {
      console.error("Error duplicating template:", err);
      toast.error("Failed to duplicate template");
    }
  };

  const openEditDialog = (template: ApprovalTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Approval Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define approval workflows for your business processes
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Approval Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gatesFilter} onValueChange={setGatesFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Gates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gates</SelectItem>
            <SelectItem value="1">1 gate</SelectItem>
            <SelectItem value="2-3">2-3 gates</SelectItem>
            <SelectItem value="4+">4+ gates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : filteredAndSortedTemplates.length === 0 && templates.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <p className="text-lg font-medium text-foreground mb-2">No approval templates yet</p>
          <p className="text-muted-foreground mb-6">Create your first approval workflow</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Approval Template
          </Button>
        </div>
      ) : filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No templates match the current filters
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort("name")}
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Gates</TableHead>
                <TableHead className="text-center">Used By</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort("updatedAt")}
                  >
                    Last Modified
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-center">{template.gateCount}</TableCell>
                  <TableCell className="text-center">
                    {template.usedByCount > 0 ? (
                      <span>{template.usedByCount} play{template.usedByCount !== 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(template.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(template.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(template)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(template)}>
                          <Archive className="h-4 w-4 mr-2" />
                          {template.status === "archived" ? "Restore" : "Archive"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Approval Template</DialogTitle>
            <DialogDescription>
              Add a new approval workflow template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Standard Deal Approval"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe when this template should be used..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Approval Template</DialogTitle>
            <DialogDescription>
              Update template name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
