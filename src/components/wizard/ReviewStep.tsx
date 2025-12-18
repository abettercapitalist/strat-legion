import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Pencil, FileText, CheckCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";
import { useApprovalWorkflow } from "@/hooks/useApprovalWorkflow";
interface ReviewStepProps {
  module: string;
  displayName: string;
  playId: string;
}

interface CommercialTerms {
  annual_contract_value?: number | null;
  payment_terms?: string;
  custom_payment_terms?: string;
  start_date?: string | null;
  end_date?: string | null;
  discount_percentage?: number | null;
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  net_30: "Net 30",
  net_60: "Net 60",
  net_90: "Net 90",
  custom: "Custom",
};

export function ReviewStep({ module, displayName, playId }: ReviewStepProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, goToStep, isSalesModule, resetWizard } = useWorkstreamWizard();
  const [isCreating, setIsCreating] = useState(false);
  const { createApprovalsFromTemplate } = useApprovalWorkflow();

  const terms = state.commercial_terms as CommercialTerms | null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPaymentTermsLabel = (value: string) => {
    return PAYMENT_TERMS_LABELS[value] || value;
  };

  const handleEdit = (step: number) => {
    goToStep(step);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate workstream name from counterparty and play
      const workstreamName = `${state.counterparty_name} - ${state.play_name}`;
      
      // Create workstream record
      const { data: workstream, error } = await supabase
        .from("workstreams")
        .insert({
          name: workstreamName,
          workstream_type_id: playId,
          counterparty_id: state.counterparty_id,
          business_objective: state.business_objective,
          annual_value: terms?.annual_contract_value || null,
          expected_close_date: terms?.end_date || null,
          stage: "draft",
          owner_id: user?.id || null,
          tier: "standard",
          notes: isSalesModule && terms?.payment_terms 
            ? `Payment Terms: ${getPaymentTermsLabel(terms.payment_terms)}${terms.discount_percentage ? `, Discount: ${terms.discount_percentage}%` : ""}`
            : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the creation activity
      await supabase.from("workstream_activity").insert({
        workstream_id: workstream.id,
        activity_type: "created",
        actor_id: user?.id || null,
        description: `${displayName} created: ${workstreamName}`,
        metadata: {
          play_id: playId,
          counterparty_id: state.counterparty_id,
          business_objective: state.business_objective,
        },
      });

      // Create approval workflow from template
      const approvalResult = await createApprovalsFromTemplate(workstream.id);
      
      if (approvalResult.success) {
        const approvalMessage = approvalResult.approvals_created 
          ? `${approvalResult.approvals_created} approval${approvalResult.approvals_created > 1 ? 's' : ''} initiated.`
          : approvalResult.auto_approved 
            ? `${approvalResult.auto_approved} approval${approvalResult.auto_approved > 1 ? 's' : ''} auto-approved.`
            : '';
        
        toast({
          title: `${displayName} created successfully!`,
          description: `${workstreamName} is now ready. ${approvalMessage}`.trim(),
        });
      } else {
        // Workstream created but approvals failed - still navigate but warn
        console.warn("Approval workflow creation failed:", approvalResult.error);
        toast({
          title: `${displayName} created`,
          description: `${workstreamName} created, but approval workflow could not be started.`,
          variant: "default",
        });
      }

      // Reset wizard and redirect
      resetWizard();
      navigate(`/${module}/${workstream.id}`);
      
    } catch (error) {
      console.error("Error creating workstream:", error);
      toast({
        title: "Failed to create workstream",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Review your {displayName.toLowerCase()} before creating.
        </p>
      </div>

      <div className="space-y-4">
        {/* Counterparty */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Counterparty</h4>
                <p className="font-medium">{state.counterparty_name || "Not selected"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(1)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business Objective */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 mr-4">
                <h4 className="font-medium text-sm text-muted-foreground">Business Objective</h4>
                <p className="font-medium">{state.business_objective || "Not specified"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(2)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Optional Steps */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Optional Steps Selected</h4>
                {state.optional_steps.length > 0 ? (
                  <ul className="space-y-1">
                    {state.optional_steps.map((stepId) => (
                      <li key={stepId} className="font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {stepId}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No optional steps selected</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(3)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Terms (Sales only) */}
        {isSalesModule && terms && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Commercial Terms</h4>
                  <ul className="space-y-1">
                    {terms.annual_contract_value && (
                      <li className="font-medium">
                        Value: {formatCurrency(terms.annual_contract_value)}
                      </li>
                    )}
                    {terms.payment_terms && (
                      <li className="font-medium">
                        Payment: {getPaymentTermsLabel(terms.payment_terms)}
                        {terms.payment_terms === "custom" && terms.custom_payment_terms && (
                          <span className="text-muted-foreground"> ({terms.custom_payment_terms})</span>
                        )}
                      </li>
                    )}
                    {terms.start_date && (
                      <li className="font-medium">
                        Start: {new Date(terms.start_date).toLocaleDateString()}
                      </li>
                    )}
                    {terms.end_date && (
                      <li className="font-medium">
                        End: {new Date(terms.end_date).toLocaleDateString()}
                      </li>
                    )}
                    {terms.discount_percentage && terms.discount_percentage > 0 && (
                      <li className="font-medium">
                        Discount: {terms.discount_percentage}%
                      </li>
                    )}
                  </ul>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(4)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* What happens next */}
      <div className="space-y-4">
        <h3 className="font-semibold">What happens next</h3>
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Documents will be generated</p>
              <p className="text-sm text-muted-foreground">
                Required documents for this {displayName.toLowerCase()} will be created automatically
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Approvals will be requested</p>
              <p className="text-sm text-muted-foreground">
                Relevant approvers will be notified based on the workflow
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">You'll be notified</p>
              <p className="text-sm text-muted-foreground">
                You'll receive updates as approvals are completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create button */}
      <div className="pt-4">
        <Button 
          size="lg" 
          className="w-full"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            `Create ${displayName}`
          )}
        </Button>
      </div>
    </div>
  );
}
