import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Check, X, HelpCircle, Sparkles, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TaggingPromptContext {
  decision_id: string;
  deal_name: string;
  decision_type: "approved" | "rejected" | "request_changes";
  prompt_reason: string;
  similar_decisions_count: number;
  novel_feature?: string;
}

interface TaggingPromptBannerProps {
  context: TaggingPromptContext;
  onSubmit: (response: TaggingResponse) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

export interface TaggingResponse {
  decision_id: string;
  free_text?: string;
  selected_factors: string[];
}

const QUICK_FACTORS = [
  { id: "customer_low_risk", label: "Customer is low-risk", description: "Established relationship with good track record" },
  { id: "legal_reviewed", label: "Legal reviewed clauses", description: "Legal team has validated the contract terms" },
  { id: "similar_to_previous", label: "Similar to previous deal", description: "Terms match an already-approved deal" },
  { id: "small_financial_impact", label: "Small financial impact", description: "Low value or limited risk exposure" },
  { id: "standard_terms", label: "Standard terms used", description: "No deviations from template" },
  { id: "time_sensitive", label: "Time-sensitive deal", description: "Business urgency required quick decision" },
  { id: "strategic_relationship", label: "Strategic relationship", description: "Important customer or partnership" },
  { id: "compliance_verified", label: "Compliance verified", description: "Regulatory requirements checked" },
];

const MAX_FREE_TEXT_LENGTH = 500;

export function TaggingPromptBanner({
  context,
  onSubmit,
  onSkip,
  isSubmitting = false,
}: TaggingPromptBannerProps) {
  const [freeText, setFreeText] = useState("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  const decisionLabel =
    context.decision_type === "approved"
      ? "Approved"
      : context.decision_type === "rejected"
      ? "Rejected"
      : "Changes Requested";

  const handleFactorToggle = (factorId: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factorId)
        ? prev.filter((f) => f !== factorId)
        : [...prev, factorId]
    );
  };

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    onSubmit({
      decision_id: context.decision_id,
      free_text: freeText.trim() || undefined,
      selected_factors: selectedFactors,
    });
  }, [context.decision_id, freeText, selectedFactors, isSubmitting, onSubmit]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasInput) {
        e.preventDefault();
        handleSubmit();
      }
      // Escape to skip
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, onSkip]);

  const hasInput = freeText.trim() || selectedFactors.length > 0;
  const remainingChars = MAX_FREE_TEXT_LENGTH - freeText.length;

  return (
    <Card 
      className="border-border/50 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300"
      role="complementary"
      aria-label="Optional feedback prompt"
    >
      {/* Success header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-border/50">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20" aria-hidden="true">
          <Check className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium text-foreground">
          {context.deal_name} {decisionLabel}
        </span>
      </div>

      {/* Prompt content */}
      <div className="p-4 space-y-4">
        {/* Why we're asking */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0" aria-hidden="true">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Quick question{" "}
              <span className="text-muted-foreground font-normal">
                (optional - help us improve)
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {context.prompt_reason}
              {context.novel_feature && (
                <span className="text-foreground font-medium">
                  {" "}
                  "{context.novel_feature}"
                </span>
              )}
              {context.similar_decisions_count > 0 && (
                <span>
                  {" "}
                  (only {context.similar_decisions_count} similar decision
                  {context.similar_decisions_count !== 1 ? "s" : ""} before)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Question */}
        <div className="space-y-3 pl-11">
          <p className="text-sm text-foreground font-medium">
            What made you comfortable with this decision?
          </p>

          {/* Free text input */}
          <div className="space-y-1.5">
            <Textarea
              placeholder="Quick response in your own words..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value.slice(0, MAX_FREE_TEXT_LENGTH))}
              className="min-h-[60px] text-sm resize-none"
              disabled={isSubmitting}
              aria-label="Your reasoning (optional)"
              maxLength={MAX_FREE_TEXT_LENGTH}
            />
            <div className="flex justify-end">
              <span className={cn(
                "text-xs",
                remainingChars < 50 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-3" role="separator">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Or select factors</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Quick factor checkboxes */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            role="group"
            aria-label="Quick factors to select"
          >
            <TooltipProvider>
              {QUICK_FACTORS.map((factor) => (
                <Tooltip key={factor.id}>
                  <TooltipTrigger asChild>
                    <label
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all",
                        selectedFactors.includes(factor.id)
                          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/50 hover:border-border hover:bg-muted/50",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Checkbox
                        checked={selectedFactors.includes(factor.id)}
                        onCheckedChange={() => handleFactorToggle(factor.id)}
                        disabled={isSubmitting}
                        className="h-4 w-4"
                        aria-describedby={`${factor.id}-desc`}
                      />
                      <span className="text-sm text-foreground">{factor.label}</span>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p id={`${factor.id}-desc`} className="text-xs">{factor.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Esc</kbd> to skip · <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">⌘</kbd>+<kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Enter</kbd> to submit
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              disabled={isSubmitting}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" aria-hidden="true" />
              Skip
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasInput}
              className="gap-1"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Submit
                  <span className="text-xs opacity-70 hidden sm:inline">(helps system learn)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
