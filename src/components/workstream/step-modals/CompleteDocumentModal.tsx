import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";

interface WorkstreamStep {
  id: string;
  workstream_id: string;
  step_type: string;
  config: Record<string, any> | null;
}

interface CompleteDocumentModalProps {
  step: WorkstreamStep;
  onClose: () => void;
  onComplete: () => void;
}

export function CompleteDocumentModal({
  step,
  onClose,
  onComplete,
}: CompleteDocumentModalProps) {
  const [fileName, setFileName] = useState("");
  const config = step.config || {};

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updatedConfig = {
        ...config,
        completion_data: {
          document_name: fileName,
          completed_at: new Date().toISOString(),
        },
      };

      const { error: updateError } = await supabase
        .from("workstream_steps")
        .update({
          status: "complete",
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          config: updatedConfig,
        })
        .eq("id", step.id);

      if (updateError) throw updateError;

      // Log activity
      const documentType = config.document_type || "document";
      const { error: activityError } = await supabase
        .from("workstream_activity")
        .insert({
          workstream_id: step.workstream_id,
          activity_type: "step_completed",
          description: `Generated: ${documentType}`,
          actor_id: user.id,
          metadata: { step_id: step.id, step_type: step.step_type, document_name: fileName },
        });

      if (activityError) console.error("Failed to log activity:", activityError);
    },
    onSuccess: () => {
      toast.success("Document step completed");
      onComplete();
    },
    onError: (error) => {
      toast.error("Failed to complete step");
      console.error(error);
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Required Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Document Type</p>
              <p className="text-sm text-muted-foreground">
                {config.document_type || "Required document"}
              </p>
            </div>
          </div>

          {config.template_id && (
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              Generate from Template
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="document">Upload Existing Document</Label>
            <div className="flex gap-2">
              <Input
                id="document"
                placeholder="Document name or reference..."
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a document name or upload a file to complete this step.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={!fileName.trim() || completeMutation.isPending}
          >
            {completeMutation.isPending ? "Completing..." : "Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
