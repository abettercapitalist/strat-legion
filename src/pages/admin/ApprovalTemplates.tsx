import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApprovalTemplates, ApprovalTemplate } from "@/hooks/useApprovalTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type SortField = "name" | "updatedAt";
type SortDirection = "asc" | "desc";

export default function ApprovalTemplates() {
  const navigate = useNavigate();
  const { templates, loading, error, refetch } = useApprovalTemplates();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routesFilter, setRoutesFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredAndSortedTemplates = useMemo(() => {
    let result = [...templates];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Apply routes filter
    if (routesFilter !== "all") {
      if (routesFilter === "1") {
        result = result.filter((t) => t.routeCount === 1);
      } else if (routesFilter === "2-3") {
        result = result.filter((t) => t.routeCount >= 2 && t.routeCount <= 3);
      } else if (routesFilter === "4+") {
        result = result.filter((t) => t.routeCount >= 4);
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
  }, [templates, statusFilter, routesFilter, sortField, sortDirection]);

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
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        toast.error("Template not found");
        return;
      }

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
        <Button onClick={() => navigate("/play-library/approval-templates/new")}>
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

        <Select value={routesFilter} onValueChange={setRoutesFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Routes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Routes</SelectItem>
            <SelectItem value="1">1 route</SelectItem>
            <SelectItem value="2-3">2-3 routes</SelectItem>
            <SelectItem value="4+">4+ routes</SelectItem>
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
          <Button onClick={() => navigate("/play-library/approval-templates/new")}>
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
                <TableHead className="text-center">Routes</TableHead>
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
                  <TableCell className="text-center">{template.routeCount}</TableCell>
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
                        <DropdownMenuItem onClick={() => navigate(`/play-library/approval-templates/${template.id}/edit`)}>
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
    </div>
  );
}
