import { useState } from "react";
import { CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { useApprovalDecision, ProcessApprovalDecisionResult } from "@/hooks/useApprovalDecision";

interface ApprovalDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalId: string;
  dealName: string;
  onDecisionComplete?: (result: ProcessApprovalDecisionResult) => void;
}

type DecisionType = "approved" | "rejected" | "request_changes";

export function ApprovalDecisionModal({
  open,
  onOpenChange,
  approvalId,
  dealName,
  onDecisionComplete,
}: ApprovalDecisionModalProps) {
  const [decision, setDecision] = useState<DecisionType>("approved");
  const [reasoning, setReasoning] = useState("");
  const { processDecision, isProcessing } = useApprovalDecision();

  const handleSubmit = async () => {
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
      
      // Reset form
      setDecision("approved");
      setReasoning("");
    } else {
      toast.error("Failed to record decision", {
        description: result.error || "Please try again",
      });
    }
  };

  const getDecisionIcon = (type: DecisionType) => {
    switch (type) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "request_changes":
        return <MessageSquare className="h-5 w-5 text-amber-600" />;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDecisionIcon(decision)}
            <span>
              {getDecisionLabel(decision)} Deal - {dealName}
            </span>
          </DialogTitle>
          <DialogDescription>
            Record your decision for this approval request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Decision Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Your Decision</Label>
            <RadioGroup
              value={decision}
              onValueChange={(value) => setDecision(value as DecisionType)}
              className="space-y-3"
            >
              {(["approved", "rejected", "request_changes"] as DecisionType[]).map((type) => (
                <div
                  key={type}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    decision === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setDecision(type)}
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
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <Label htmlFor="reasoning" className="text-sm font-medium">
              Reasoning{" "}
              <span className="text-muted-foreground font-normal">
                (optional but helpful)
              </span>
            </Label>
            <Textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Customer has good payment history. Net 90 acceptable for enterprise accounts..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your reasoning helps the system learn and improve future recommendations
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={
              decision === "approved"
                ? "bg-green-600 hover:bg-green-700"
                : decision === "rejected"
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-amber-600 hover:bg-amber-700"
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Decision"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
