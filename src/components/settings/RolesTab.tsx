import { useState } from "react";
import { useRBAC, Role } from "@/contexts/RBACContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Shield, Loader2, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

export function RolesTab() {
  const { roles, permissions, users, addRole, updateRole, deleteRole, isLoading } = useRBAC();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    isSystemRole: false,
    isWorkRouting: false,
    isManagerRole: false,
  });

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: [],
      isSystemRole: false,
      isWorkRouting: false,
      isManagerRole: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystemRole: role.isSystemRole,
      isWorkRouting: role.isWorkRouting ?? false,
      isManagerRole: role.isManagerRole ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Role name is required");
      return;
    }

    setIsSaving(true);
    try {
      const roleData = {
        ...formData,
        displayName: formData.name,
        parentId: null,
      };
      if (editingRole) {
        await updateRole(editingRole.id, roleData);
        toast.success("Role updated successfully");
      } else {
        await addRole(roleData);
        toast.success("Role created successfully");
      }
        toast.success("Role created successfully");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save role");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    const usersWithRole = users.filter((u) => u.roleIds.includes(role.id));
    if (usersWithRole.length > 0) {
      toast.error(
        `Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role.`
      );
      return;
    }
    if (confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      try {
        await deleteRole(role.id);
        toast.success("Role deleted");
      } catch (error) {
        toast.error("Failed to delete role");
        console.error(error);
      }
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const selectAllInModule = (module: string) => {
    const modulePermissions = permissions
      .filter((p) => p.module === module)
      .map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      permissions: [...new Set([...prev.permissions, ...modulePermissions])],
    }));
  };

  const deselectAllInModule = (module: string) => {
    const modulePermissionIds = permissions
      .filter((p) => p.module === module)
      .map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter(
        (id) => !modulePermissionIds.includes(id)
      ),
    }));
  };

  const groupedPermissions = {
    law: permissions.filter((p) => p.module === "law"),
    sales: permissions.filter((p) => p.module === "sales"),
    system: permissions.filter((p) => p.module === "system"),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define roles and assign permissions to control access and work routing
        </p>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => {
              const userCount = users.filter((u) =>
                u.roleIds.includes(role.id)
              ).length;
              return (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{role.name}</span>
                      {role.isSystemRole && (
                        <Badge variant="outline" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.isWorkRouting && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Users className="h-3 w-3" />
                          Work Routing
                        </Badge>
                      )}
                      {role.isManagerRole && (
                        <Badge variant="default" className="text-xs gap-1">
                          <UserCheck className="h-3 w-3" />
                          Manager
                        </Badge>
                      )}
                      {!role.isWorkRouting && !role.isManagerRole && (
                        <span className="text-xs text-muted-foreground">Permission only</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {role.permissions.length} permissions
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{userCount} users</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role)}
                        disabled={role.isSystemRole}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Modify role settings, permissions, and capabilities"
                : "Define a new role with specific permissions and work routing options"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Senior Contract Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this role is responsible for..."
                rows={2}
              />
            </div>

            {/* Role capabilities */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Role Capabilities</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="workRouting" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Work Routing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable this role to be used for assigning tasks, needs, and approvals
                  </p>
                </div>
                <Switch
                  id="workRouting"
                  checked={formData.isWorkRouting}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isWorkRouting: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="managerRole" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Manager Role
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Grants elevated data access (can view all workstreams and approve on behalf of team)
                  </p>
                </div>
                <Switch
                  id="managerRole"
                  checked={formData.isManagerRole}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isManagerRole: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissions</Label>

              {(["law", "sales", "system"] as const).map((module) => (
                <div key={module} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize">{module} Module</h4>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInModule(module)}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deselectAllInModule(module)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {groupedPermissions[module].map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <Checkbox
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <div>
                          <span className="text-sm font-medium">
                            {permission.name}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
