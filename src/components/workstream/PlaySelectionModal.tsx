import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { usePlaybookPlays } from "@/hooks/usePlaybookPlays";

interface PlaySelectionModalProps {
  workstreamId: string;
  workstreamTypeId: string | null;
  onPlaySelected: (playId: string, playbookId: string) => void;
  onClose: () => void;
}

export function PlaySelectionModal({
  workstreamId,
  workstreamTypeId,
  onPlaySelected,
  onClose,
}: PlaySelectionModalProps) {
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const { playbook, patterns, playsByPattern, isLoading } =
    usePlaybookPlays(workstreamTypeId);

  const handleConfirm = () => {
    if (selectedPlayId && playbook) {
      onPlaySelected(selectedPlayId, playbook.id);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Play</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading && (
            <div className="space-y-3">
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
            </div>
          )}

          {!isLoading && !playbook && (
            <p className="text-muted-foreground text-center py-6">
              No playbook is configured for this workstream type.
            </p>
          )}

          {!isLoading &&
            playbook &&
            patterns.map((pattern) => {
              const plays = playsByPattern.get(pattern.id) || [];
              if (plays.length === 0) return null;

              return (
                <div key={pattern.id}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {pattern.display_name}
                  </h3>
                  <div className="space-y-2">
                    {plays.map((play) => {
                      const isSelected = selectedPlayId === play.id;
                      return (
                        <button
                          key={play.id}
                          type="button"
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-accent/50"
                          }`}
                          onClick={() => setSelectedPlayId(play.id)}
                        >
                          <div className="font-medium text-sm">
                            {play.display_name}
                          </div>
                          {play.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {play.description}
                            </p>
                          )}
                          {play.estimated_duration_minutes != null && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {play.estimated_duration_minutes} min
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPlayId}>
            Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
