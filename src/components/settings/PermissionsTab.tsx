import { useRBAC } from "@/contexts/RBACContext";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Scale, TrendingUp, Settings, Check, Loader2 } from "lucide-react";

export function PermissionsTab() {
  const { permissions, roles, isLoading } = useRBAC();

  const groupedPermissions = {
    law: permissions.filter((p) => p.module === "law"),
    sales: permissions.filter((p) => p.module === "sales"),
    system: permissions.filter((p) => p.module === "system"),
  };

  const moduleIcons = {
    law: Scale,
    sales: TrendingUp,
    system: Settings,
  };

  const moduleLabels = {
    law: "Law Module",
    sales: "Sales Module",
    system: "System Administration",
  };

  const getRolesWithPermission = (permissionId: string) => {
    return roles.filter((r) => r.permissions.includes(permissionId));
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
      <p className="text-sm text-muted-foreground">
        View all available permissions and which roles have access to them
      </p>

      <Accordion type="multiple" defaultValue={["law", "sales", "system"]} className="space-y-4">
        {(["law", "sales", "system"] as const).map((module) => {
          const Icon = moduleIcons[module];
          return (
            <AccordionItem
              key={module}
              value={module}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{moduleLabels[module]}</span>
                  <Badge variant="secondary" className="ml-2">
                    {groupedPermissions[module].length} permissions
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Permission</TableHead>
                      <TableHead className="w-1/3">Description</TableHead>
                      <TableHead>Granted To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPermissions[module].map((permission) => {
                      const rolesWithPerm = getRolesWithPermission(permission.id);
                      return (
                        <TableRow key={permission.id}>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {permission.id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {permission.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rolesWithPerm.length > 0 ? (
                                rolesWithPerm.map((role) => (
                                  <Badge
                                    key={role.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    {role.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No roles assigned
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
