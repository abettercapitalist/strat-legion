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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useRoles, Role } from "@/hooks/useRoles";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentRole?: Role | null;
  onRoleCreated?: (role: Role) => void;
  isWorkRouting?: boolean;
}

export function CreateRoleModal({
  open,
  onOpenChange,
  parentRole,
  onRoleCreated,
  isWorkRouting = true,
}: CreateRoleModalProps) {
  const { createRole } = useRoles();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
    is_manager_role: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name.trim()) return;

    setIsCreating(true);
    try {
      const result = await createRole.mutateAsync({
        name: formData.display_name.toLowerCase().replace(/\s+/g, "_"),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || undefined,
        is_work_routing: isWorkRouting,
        is_manager_role: formData.is_manager_role,
        parent_id: parentRole?.id || null,
      });
      
      onRoleCreated?.(result);
      setFormData({ display_name: "", description: "", is_manager_role: false });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create role:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({ display_name: "", description: "", is_manager_role: false });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {parentRole 
                ? `Create sub-group in ${parentRole.display_name || parentRole.name}` 
                : "Create new role"}
            </DialogTitle>
            <DialogDescription>
              {parentRole
                ? "Add a sub-group for more specific work routing."
                : "Create a new role for assigning tasks and permissions."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Role Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="e.g., Senior Contract Counsel"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this role responsible for?"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_manager">Manager Role</Label>
                <p className="text-xs text-muted-foreground">
                  Grants elevated data access (can view all workstreams)
                </p>
              </div>
              <Switch
                id="is_manager"
                checked={formData.is_manager_role}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_manager_role: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.display_name.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
