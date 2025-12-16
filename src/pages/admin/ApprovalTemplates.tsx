import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Copy } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApprovalTemplates } from "@/hooks/useApprovalTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ApprovalTemplates() {
  const { templates, loading, error, refetch } = useApprovalTemplates();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

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
          is_active: true,
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

  const handleDelete = async (template: typeof templates[0]) => {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;

    try {
      const { error: deleteError } = await supabase
        .from("approval_templates")
        .delete()
        .eq("id", template.id);

      if (deleteError) throw deleteError;

      toast.success("Approval template deleted");
      refetch();
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error("Failed to delete template");
    }
  };

  const handleDuplicate = async (template: typeof templates[0]) => {
    try {
      // Fetch full template data
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
          is_active: true,
        });

      if (insertError) throw insertError;

      toast.success("Approval template duplicated");
      refetch();
    } catch (err) {
      console.error("Error duplicating template:", err);
      toast.error("Failed to duplicate template");
    }
  };

  const openEditDialog = (template: typeof templates[0]) => {
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
            Configure approval workflows for plays and workstreams
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
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
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No approval templates yet</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Gates</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {template.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {template.gateCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
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
                        <DropdownMenuItem
                          onClick={() => handleDelete(template)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
