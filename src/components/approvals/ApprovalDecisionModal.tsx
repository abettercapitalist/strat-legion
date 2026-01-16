import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, MessageSquare, Loader2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useApprovalDecision, ProcessApprovalDecisionResult } from "@/hooks/useApprovalDecision";

interface ApprovalDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalId: string;
  dealName: string;
  onDecisionComplete?: (result: ProcessApprovalDecisionResult) => void;
  /** If provided, restricts modal to only show this decision option */
  initialDecision?: "approved" | "rejected";
}

type DecisionType = "approved" | "rejected" | "request_changes";

const MAX_REASONING_LENGTH = 1000;

export function ApprovalDecisionModal({
  open,
  onOpenChange,
  approvalId,
  dealName,
  onDecisionComplete,
  initialDecision,
}: ApprovalDecisionModalProps) {
  const [decision, setDecision] = useState<DecisionType>("approved");
  const [reasoning, setReasoning] = useState("");
  const { processDecision, isProcessing } = useApprovalDecision();

  // Determine if we're in locked mode (only one decision type allowed)
  const isLockedDecision = !!initialDecision;
  const availableDecisions: DecisionType[] = initialDecision 
    ? [initialDecision] 
    : ["approved", "rejected", "request_changes"];

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setDecision(initialDecision || "approved");
      setReasoning("");
    }
  }, [open, initialDecision]);

  const handleSubmit = useCallback(async () => {
    if (isProcessing) return;

    const result = await processDecision({
      approval_id: approvalId,
      decision,
      reasoning: reasoning.trim() || undefined,
      decision_factors: {
        submitted_via: "modal",
        has_reasoning: reasoning.trim().length > 0,
      },
    });

    if (result.success) {
      const decisionLabel = decision === "approved" ? "approved" : 
        decision === "rejected" ? "rejected" : "requested changes for";
      
      toast.success(`Decision recorded`, {
        description: `You ${decisionLabel} ${dealName}. ${
          result.auto_tags && result.auto_tags.length > 0 
            ? `Auto-tagged: ${result.auto_tags.join(", ")}`
            : ""
        }`,
      });

      onDecisionComplete?.(result);
      onOpenChange(false);
    } else {
      toast.error("Failed to record decision", {
        description: result.error || "Please try again",
      });
    }
  }, [approvalId, decision, reasoning, isProcessing, processDecision, dealName, onDecisionComplete, onOpenChange]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleSubmit]);

  const getDecisionIcon = (type: DecisionType) => {
    switch (type) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />;
      case "request_changes":
        return <MessageSquare className="h-5 w-5 text-amber-600" aria-hidden="true" />;
    }
  };

  const getDecisionLabel = (type: DecisionType) => {
    switch (type) {
      case "approved":
        return "Approve";
      case "rejected":
        return "Reject";
      case "request_changes":
        return "Request Changes";
    }
  };

  const getDecisionDescription = (type: DecisionType) => {
    switch (type) {
      case "approved":
        return "Accept this deal and advance to the next approval stage";
      case "rejected":
        return "Decline this deal - it will not proceed";
      case "request_changes":
        return "Ask for modifications before making a final decision";
    }
  };

  const remainingChars = MAX_REASONING_LENGTH - reasoning.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby="approval-decision-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDecisionIcon(decision)}
            <span>
              {isLockedDecision 
                ? `${getDecisionLabel(decision)} - ${dealName}`
                : `${getDecisionLabel(decision)} Deal - ${dealName}`
              }
            </span>
          </DialogTitle>
          <DialogDescription id="approval-decision-description">
            {isLockedDecision 
              ? `Confirm your ${decision === "approved" ? "approval" : "rejection"} for this request`
              : "Record your decision for this approval request"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Decision Selection - only show if not locked to single decision */}
          {!isLockedDecision ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Your Decision</legend>
              <RadioGroup
                value={decision}
                onValueChange={(value) => setDecision(value as DecisionType)}
                className="space-y-3"
                aria-label="Select your decision"
              >
                {availableDecisions.map((type) => (
                  <div
                    key={type}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      decision === type
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setDecision(type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDecision(type);
                      }
                    }}
                  >
                    <RadioGroupItem value={type} id={type} className="mt-0.5" />
                    <div className="flex-1">
                      <Label
                        htmlFor={type}
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        {getDecisionIcon(type)}
                        {getDecisionLabel(type)}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getDecisionDescription(type)}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          ) : (
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${
              decision === "approved" 
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" 
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }`}>
              {getDecisionIcon(decision)}
              <div>
                <p className="font-medium">{getDecisionLabel(decision)}</p>
                <p className="text-xs text-muted-foreground">{getDecisionDescription(decision)}</p>
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reasoning" className="text-sm font-medium flex items-center gap-1.5">
                Reasoning
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p className="text-xs">
                        Your reasoning helps the system learn patterns and improve future recommendations. It also helps reviewers understand your decision.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-muted-foreground font-normal ml-1">
                  (optional)
                </span>
              </Label>
              <span 
                className={`text-xs ${
                  isOverLimit ? "text-destructive" : 
                  remainingChars < 100 ? "text-amber-600" : "text-muted-foreground"
                }`}
                aria-live="polite"
              >
                {remainingChars} characters remaining
              </span>
            </div>
            <Textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Customer has good payment history. Net 90 acceptable for enterprise accounts..."
              rows={3}
              className={`resize-none ${isOverLimit ? "border-destructive focus-visible:ring-destructive" : ""}`}
              maxLength={MAX_REASONING_LENGTH + 50}
              aria-describedby="reasoning-hint"
              aria-invalid={isOverLimit}
            />
            <p id="reasoning-hint" className="text-xs text-muted-foreground">
              Your reasoning helps the system learn and improve future recommendations
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">⌘</kbd>+<kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Enter</kbd> to submit
          </span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || isOverLimit}
              className={
                decision === "approved"
                  ? "bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
                  : decision === "rejected"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600"
              }
              aria-busy={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  <span>Processing...</span>
                </>
              ) : (
                isLockedDecision 
                  ? `Confirm ${decision === "approved" ? "Approval" : "Rejection"}`
                  : "Submit Decision"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
