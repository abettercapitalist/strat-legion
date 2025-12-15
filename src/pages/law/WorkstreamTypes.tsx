import { Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkstreamTypes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Workstream Types</h1>
        <p className="text-muted-foreground mt-1">
          Configure workstream types and their default workflows
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Workstream Types
          </CardTitle>
          <CardDescription>
            Define the types of workstreams available in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Workstream type configuration coming soon. This will allow you to define:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Workstream type names and descriptions</li>
            <li>Required documents for each type</li>
            <li>Default workflows and approval sequences</li>
            <li>Associated templates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
