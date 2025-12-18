import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface WorkstreamDocumentsTabProps {
  workstreamId: string;
}

export function WorkstreamDocumentsTab({ workstreamId }: WorkstreamDocumentsTabProps) {
  // Documents functionality will be implemented when storage is set up
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No documents attached yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Documents will appear here once generated or uploaded
        </p>
      </CardContent>
    </Card>
  );
}