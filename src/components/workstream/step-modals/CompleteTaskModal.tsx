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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WorkstreamStep {
  id: string;
  workstream_id: string;
  step_type: string;
  config: Record<string, any> | null;
}

interface CompleteTaskModalProps {
  step: WorkstreamStep;
  onClose: () => void;
  onComplete: () => void;
}

export function CompleteTaskModal({
  step,
  onClose,
  onComplete,
}: CompleteTaskModalProps) {
  const [notes, setNotes] = useState("");
  const config = step.config || {};

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updatedConfig = {
        ...config,
        completion_data: {
          notes,
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
      const description = config.task_description || "Completed assigned task";
      const { error: activityError } = await supabase
        .from("workstream_activity")
        .insert({
          workstream_id: step.workstream_id,
          activity_type: "step_completed",
          description: `Completed: ${description}`,
          actor_id: user.id,
          metadata: { step_id: step.id, step_type: step.step_type },
        });

      if (activityError) console.error("Failed to log activity:", activityError);
    },
    onSuccess: () => {
      toast.success("Task completed successfully");
      onComplete();
    },
    onError: (error) => {
      toast.error("Failed to complete task");
      console.error(error);
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              {config.task_description || "Complete this task to proceed."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Completion Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about how the task was completed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? "Completing..." : "Mark as Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
