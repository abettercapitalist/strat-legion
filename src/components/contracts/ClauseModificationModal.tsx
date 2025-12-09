import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Copy, Check, Lock, Unlock, Info } from 'lucide-react';
import { toast } from 'sonner';

// Types for clause configuration (from template, not clause itself)
export interface ClauseAlternative {
  id: string;
  label: string;
  text: string;
  useCase: string;
  isPreApproved: boolean;
}

export interface ClauseConfig {
  clauseId: string;
  clauseTitle: string;
  clauseNumber: string;
  currentText: string;
  status: 'modifiable' | 'locked';
  alternatives: ClauseAlternative[];
  responseLibraryExcerpt?: string;
  customerResponse?: string;
  businessContext?: string;
}

interface ClauseModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clause: ClauseConfig | null;
  onSelectAlternative?: (clauseId: string, alternativeId: string) => void;
  onSubmitChangeRequest?: (clauseId: string, proposedChange: string, justification: string) => void;
}

export function ClauseModificationModal({
  open,
  onOpenChange,
  clause,
  onSelectAlternative,
  onSubmitChangeRequest,
}: ClauseModificationModalProps) {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [proposedChange, setProposedChange] = useState('');
  const [justification, setJustification] = useState('');
  const [copied, setCopied] = useState(false);

  if (!clause) return null;

  const preApprovedAlternatives = clause.alternatives.filter(alt => alt.isPreApproved);
  const hasPreApprovedOptions = preApprovedAlternatives.length > 0;
  const isLocked = clause.status === 'locked';

  const handleCopyResponse = () => {
    if (clause.customerResponse) {
      navigator.clipboard.writeText(clause.customerResponse);
      setCopied(true);
      toast.success('Response copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectAlternative = () => {
    if (selectedAlternative && onSelectAlternative) {
      onSelectAlternative(clause.clauseId, selectedAlternative);
      onOpenChange(false);
      toast.success('Clause alternative applied');
    }
  };

  const handleSubmitChangeRequest = () => {
    if (proposedChange && justification && onSubmitChangeRequest) {
      onSubmitChangeRequest(clause.clauseId, proposedChange, justification);
      onOpenChange(false);
      toast.info('Change request submitted for review');
    }
  };

  const resetState = () => {
    setSelectedAlternative(null);
    setShowChangeRequest(false);
    setProposedChange('');
    setJustification('');
    setCopied(false);
  };

  // Locked clause view - strong warning with customer response
  if (isLocked) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              <DialogTitle className="text-lg">
                {clause.clauseNumber}: {clause.clauseTitle}
              </DialogTitle>
            </div>
            <Badge variant="destructive" className="w-fit mt-2">
              Cannot Be Modified
            </Badge>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning message */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    This clause cannot be modified for your customer.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Submitting a request to change this clause will significantly delay the review 
                    period and the proposed change is unlikely to be accepted.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer response section */}
            {clause.customerResponse && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Suggested Response for Customer</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyResponse}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to Share
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground italic mb-2">
                    Share this response with your customer:
                  </p>
                  <p className="text-foreground">{clause.customerResponse}</p>
                </div>
              </div>
            )}

            {/* Current clause text */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Current Clause Text</span>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border">
                {clause.currentText}
              </div>
            </div>

            {/* Change request option (discouraged but available) */}
            {!showChangeRequest ? (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChangeRequest(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  I still need to request a change...
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Change Request (Not Recommended)</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="proposed-change">Proposed Change</Label>
                    <Textarea
                      id="proposed-change"
                      placeholder="Describe the specific change your customer is requesting..."
                      value={proposedChange}
                      onChange={(e) => setProposedChange(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="justification">Business Justification</Label>
                    <Textarea
                      id="justification"
                      placeholder="Explain why this change is necessary for closing the deal..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {showChangeRequest && (
              <Button
                variant="destructive"
                onClick={handleSubmitChangeRequest}
                disabled={!proposedChange || !justification}
              >
                Submit Request Anyway
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Modifiable clause view - show alternatives
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">
              {clause.clauseNumber}: {clause.clauseTitle}
            </DialogTitle>
          </div>
          <DialogDescription>
            {clause.businessContext || 'Select from pre-approved alternatives or request a custom change.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current clause text */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Current Text</span>
            <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border">
              {clause.currentText}
            </div>
          </div>

          <Separator />

          {/* Pre-approved alternatives */}
          {hasPreApprovedOptions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Pre-Approved Alternatives</span>
                <Badge variant="secondary" className="text-xs">No approval needed</Badge>
              </div>
              
              <RadioGroup value={selectedAlternative || ''} onValueChange={setSelectedAlternative}>
                {preApprovedAlternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAlternative === alt.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setSelectedAlternative(alt.id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={alt.id} id={alt.id} className="mt-1" />
                      <div className="space-y-1 flex-1">
                        <Label htmlFor={alt.id} className="font-medium cursor-pointer">
                          {alt.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{alt.text}</p>
                        {alt.useCase && (
                          <p className="text-xs text-muted-foreground/70 italic">
                            Best for: {alt.useCase}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Request custom change option */}
          {!showChangeRequest ? (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangeRequest(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Need something different? Request a custom change...
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Custom Change Request</span>
                <Badge variant="outline" className="text-xs">Requires approval</Badge>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Requesting a change outside pre-approved options will require legal review 
                  and may delay your deal timeline.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="proposed-change-mod">Proposed Change</Label>
                  <Textarea
                    id="proposed-change-mod"
                    placeholder="Describe the specific change your customer is requesting..."
                    value={proposedChange}
                    onChange={(e) => setProposedChange(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justification-mod">Business Justification</Label>
                  <Textarea
                    id="justification-mod"
                    placeholder="Explain why this change is necessary for closing the deal..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedAlternative && !showChangeRequest && (
            <Button onClick={handleSelectAlternative}>
              Apply Alternative
            </Button>
          )}
          {showChangeRequest && (
            <Button
              variant="secondary"
              onClick={handleSubmitChangeRequest}
              disabled={!proposedChange || !justification}
            >
              Submit for Approval
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
