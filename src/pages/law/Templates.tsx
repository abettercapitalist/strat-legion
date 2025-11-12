import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Copy, Archive, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const templates = [
  {
    id: "1",
    name: "Framework Agreement",
    category: "Sales",
    version: "v2.1",
    status: "Active",
    lastModified: "2025-11-10",
  },
  {
    id: "2",
    name: "Mutual NDA",
    category: "Sales",
    version: "v1.0",
    status: "Active",
    lastModified: "2025-11-08",
  },
  {
    id: "3",
    name: "Enterprise SaaS Agreement",
    category: "Sales",
    version: "v3.0",
    status: "Active",
    lastModified: "2025-11-05",
  },
  {
    id: "4",
    name: "Professional Services Agreement",
    category: "Services",
    version: "v1.2",
    status: "Active",
    lastModified: "2025-10-28",
  },
  {
    id: "5",
    name: "Master Vendor Agreement",
    category: "Procurement",
    version: "v1.0",
    status: "Active",
    lastModified: "2025-10-15",
  },
];

const categories = ["All", "Sales", "Procurement", "Employment", "Services", "Partnership"];
const statuses = ["All", "Active", "Draft", "Archived"];

export default function Templates() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage contract templates and their configurations
          </p>
        </div>
        <Link to="/law/templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={cat === "All" ? "default" : "outline"}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

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
            {templates.map((template) => (
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
                    className="bg-status-success/10 text-status-success border-status-success/20"
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
                      <DropdownMenuItem className="text-destructive">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
