import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Check, X, HelpCircle, Sparkles } from "lucide-react";
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
  { id: "customer_low_risk", label: "Customer is low-risk" },
  { id: "legal_reviewed", label: "Legal reviewed clauses" },
  { id: "similar_to_previous", label: "Similar to previous deal" },
  { id: "small_financial_impact", label: "Small financial impact" },
  { id: "standard_terms", label: "Standard terms used" },
  { id: "time_sensitive", label: "Time-sensitive deal" },
  { id: "strategic_relationship", label: "Strategic relationship" },
  { id: "compliance_verified", label: "Compliance verified" },
];

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

  const handleSubmit = () => {
    onSubmit({
      decision_id: context.decision_id,
      free_text: freeText.trim() || undefined,
      selected_factors: selectedFactors,
    });
  };

  const hasInput = freeText.trim() || selectedFactors.length > 0;

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* Success header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-border/50">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20">
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
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
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
          <p className="text-sm text-foreground">
            What made you comfortable with this decision?
          </p>

          {/* Free text input */}
          <Textarea
            placeholder="Quick response in your own words..."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            disabled={isSubmitting}
          />

          {/* Or divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Or select factors</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Quick factor checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            {QUICK_FACTORS.map((factor) => (
              <label
                key={factor.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                  selectedFactors.includes(factor.id)
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 hover:border-border hover:bg-muted/50",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={selectedFactors.includes(factor.id)}
                  onCheckedChange={() => handleFactorToggle(factor.id)}
                  disabled={isSubmitting}
                  className="h-4 w-4"
                />
                <span className="text-sm text-foreground">{factor.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasInput}
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Submit
                <span className="text-xs opacity-70">(helps system learn)</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
