import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";

interface WorkstreamDocumentsTabProps {
  workstreamId: string;
}

export function WorkstreamDocumentsTab({ workstreamId }: WorkstreamDocumentsTabProps) {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["workstream_documents", workstreamId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("workstream_documents")
        .select("*")
        .eq("workstream_id", workstreamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs && docs.some((d: any) => d.status === "generating")) {
        return 5000;
      }
      return false;
    },
  });

  const handleDownload = async (storagePath: string, title: string) => {
    const { data, error } = await supabase.storage
      .from("workstream-documents")
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL:", error);
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
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

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{doc.document_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {doc.status === "generating" && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </Badge>
              )}

              {doc.status === "ready" && (
                <>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Ready
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.storage_path!, doc.title)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </>
              )}

              {doc.status === "error" && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </Badge>
                  {doc.error_message && (
                    <span className="text-xs text-destructive max-w-48 truncate">
                      {doc.error_message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
