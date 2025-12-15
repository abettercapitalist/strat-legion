import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, MoreHorizontal, Pencil, Copy, Archive, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkstreamTypes, type WorkstreamTypeFilters } from "@/hooks/useWorkstreamTypes";

const STATUS_OPTIONS = ["All", "Active", "Draft", "Archived"];
const TEAM_CATEGORY_OPTIONS = ["All", "Sales", "Law", "Finance", "Pro Services"];

export default function WorkstreamTypes() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WorkstreamTypeFilters>({
    status: "All",
    team_category: "All"
  });
  const {
    workstreamTypes,
    isLoading,
    duplicateWorkstreamType,
    archiveWorkstreamType
  } = useWorkstreamTypes(filters);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Draft":
        return "secondary";
      case "Archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/workstream-types/${id}/edit`);
  };

  const handleDuplicate = (id: string) => {
    duplicateWorkstreamType.mutate(id);
  };

  const handleArchive = (id: string) => {
    archiveWorkstreamType.mutate(id);
  };
  if (isLoading) {
    return <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          {[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>)}
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Your Play Library</h1>
          <p className="text-muted-foreground mt-1">Build your plays and their default workflows</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Play
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/admin/workstream-types/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create from scratch
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Import Public Plays
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filters.status} onValueChange={value => setFilters(prev => ({
        ...prev,
        status: value
      }))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>
                {status}
              </SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.team_category} onValueChange={value => setFilters(prev => ({
        ...prev,
        team_category: value
      }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            {TEAM_CATEGORY_OPTIONS.map(category => <SelectItem key={category} value={category}>
                {category}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table or Empty State */}
      {workstreamTypes.length === 0 ? <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No plays yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first play to get started
          </p>
          <Button onClick={() => navigate('/admin/workstream-types/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Play
          </Button>
        </div> : <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Display Name</TableHead>
                <TableHead className="font-medium text-center">Active Instances</TableHead>
                <TableHead className="font-medium">Last Modified</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workstreamTypes.map((type, index) => <TableRow key={type.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary hover:underline"
                    onClick={() => handleEdit(type.id)}
                  >
                    {type.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.display_name || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {type.active_workstreams_count}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(type.updated_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(type.status)}>
                      {type.status}
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
                        <DropdownMenuItem onClick={() => handleEdit(type.id)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(type.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(type.id)} disabled={type.status === "Archived"}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>}
    </div>;
}