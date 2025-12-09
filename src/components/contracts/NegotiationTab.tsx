import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, List, MessageSquarePlus, Clock, Check, AlertTriangle } from 'lucide-react';
import { ContractPreview } from './ContractPreview';
import { ClauseModificationModal, ClauseConfig } from './ClauseModificationModal';
import { toast } from 'sonner';

// Mock clause data for the deal
const mockClauses: ClauseConfig[] = [
  {
    clauseId: '1',
    clauseNumber: '1',
    clauseTitle: 'Services',
    currentText: 'Provider agrees to provide the services described in Exhibit A ("Services") to Customer in accordance with the terms of this Agreement.',
    status: 'modifiable',
    businessContext: 'Defines the scope of services being provided.',
    alternatives: [
      {
        id: 'alt-1a',
        label: 'Standard Services',
        text: 'Provider agrees to provide the services described in Exhibit A ("Services") to Customer in accordance with the terms of this Agreement.',
        useCase: 'Standard engagements',
        isPreApproved: true,
      },
      {
        id: 'alt-1b',
        label: 'Expanded Services with SLA',
        text: 'Provider agrees to provide the services described in Exhibit A ("Services") to Customer in accordance with the terms of this Agreement, including the service level commitments set forth in Exhibit B.',
        useCase: 'Enterprise customers requiring SLA guarantees',
        isPreApproved: true,
      },
    ],
  },
  {
    clauseId: '2',
    clauseNumber: '2',
    clauseTitle: 'Payment Terms',
    currentText: 'Customer shall pay all fees within thirty (30) days of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month.',
    status: 'modifiable',
    businessContext: 'Governs payment timing and late payment penalties.',
    alternatives: [
      {
        id: 'alt-2a',
        label: 'Net 30 Standard',
        text: 'Customer shall pay all fees within thirty (30) days of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month.',
        useCase: 'Standard payment terms',
        isPreApproved: true,
      },
      {
        id: 'alt-2b',
        label: 'Net 45 Extended',
        text: 'Customer shall pay all fees within forty-five (45) days of the invoice date. Late payments shall accrue interest at the rate of 1.0% per month.',
        useCase: 'Large enterprise customers with longer payment cycles',
        isPreApproved: true,
      },
      {
        id: 'alt-2c',
        label: 'Net 60 Enterprise',
        text: 'Customer shall pay all fees within sixty (60) days of the invoice date. Late payments shall accrue interest at the rate of 0.5% per month.',
        useCase: 'Strategic accounts with complex procurement',
        isPreApproved: true,
      },
    ],
  },
  {
    clauseId: '3',
    clauseNumber: '3',
    clauseTitle: 'Term and Renewal',
    currentText: 'This Agreement shall commence on the Effective Date and continue for one (1) year ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive one (1) year periods unless either party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.',
    status: 'modifiable',
    businessContext: 'Sets the contract duration and renewal terms.',
    alternatives: [
      {
        id: 'alt-3a',
        label: '1 Year Auto-Renew',
        text: 'This Agreement shall commence on the Effective Date and continue for one (1) year ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive one (1) year periods unless either party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.',
        useCase: 'Standard subscription agreements',
        isPreApproved: true,
      },
      {
        id: 'alt-3b',
        label: '2 Year Initial Term',
        text: 'This Agreement shall commence on the Effective Date and continue for two (2) years ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive one (1) year periods unless either party provides written notice of non-renewal at least sixty (60) days prior to the end of the then-current term.',
        useCase: 'Long-term strategic partnerships',
        isPreApproved: true,
      },
    ],
  },
  {
    clauseId: '4',
    clauseNumber: '4',
    clauseTitle: 'Limitation of Liability',
    currentText: 'IN NO EVENT SHALL EITHER PARTY\'S TOTAL AGGREGATE LIABILITY EXCEED THE AMOUNTS PAID BY CUSTOMER TO PROVIDER DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.',
    status: 'locked',
    businessContext: 'Caps maximum liability exposure.',
    customerResponse: 'Our liability limitation is a core term that has been approved by our board and insurance providers. This cap at 12 months of fees is consistent with industry standards and allows us to offer competitive pricing. Modifying this term would require executive approval and may impact our ability to close on your timeline.',
    alternatives: [],
  },
  {
    clauseId: '5',
    clauseNumber: '5',
    clauseTitle: 'Indemnification',
    currentText: 'Provider shall indemnify, defend, and hold harmless Customer from any third-party claims arising from Provider\'s gross negligence or willful misconduct in performing the Services.',
    status: 'locked',
    businessContext: 'Defines protection against third-party claims.',
    customerResponse: 'Our indemnification scope is limited to gross negligence and willful misconduct, which is the industry standard for SaaS providers. Expanding this scope would require additional insurance coverage and would impact pricing. We recommend proceeding with the standard terms.',
    alternatives: [],
  },
  {
    clauseId: '6',
    clauseNumber: '6',
    clauseTitle: 'Confidentiality',
    currentText: 'Each party agrees to maintain the confidentiality of the other party\'s Confidential Information for a period of three (3) years following disclosure.',
    status: 'modifiable',
    businessContext: 'Protects sensitive business information.',
    alternatives: [
      {
        id: 'alt-6a',
        label: '3 Year Standard',
        text: 'Each party agrees to maintain the confidentiality of the other party\'s Confidential Information for a period of three (3) years following disclosure.',
        useCase: 'Standard confidentiality period',
        isPreApproved: true,
      },
      {
        id: 'alt-6b',
        label: '5 Year Extended',
        text: 'Each party agrees to maintain the confidentiality of the other party\'s Confidential Information for a period of five (5) years following disclosure.',
        useCase: 'Highly sensitive industries (healthcare, finance)',
        isPreApproved: true,
      },
    ],
  },
  {
    clauseId: 'D1',
    clauseNumber: 'D.1',
    clauseTitle: 'Confidential Information',
    currentText: '"Confidential Information" means any non-public information disclosed by one party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential.',
    status: 'modifiable',
    businessContext: 'Defines what constitutes confidential information.',
    alternatives: [
      {
        id: 'alt-d1a',
        label: 'Standard Definition',
        text: '"Confidential Information" means any non-public information disclosed by one party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential.',
        useCase: 'Most agreements',
        isPreApproved: true,
      },
    ],
  },
  {
    clauseId: 'D2',
    clauseNumber: 'D.2',
    clauseTitle: 'Services',
    currentText: '"Services" means the software-as-a-service platform and related support services described in Exhibit A.',
    status: 'modifiable',
    businessContext: 'Defines the scope of services.',
    alternatives: [
      {
        id: 'alt-d2a',
        label: 'SaaS Only',
        text: '"Services" means the software-as-a-service platform and related support services described in Exhibit A.',
        useCase: 'Standard SaaS engagements',
        isPreApproved: true,
      },
      {
        id: 'alt-d2b',
        label: 'SaaS + Professional Services',
        text: '"Services" means the software-as-a-service platform, implementation services, and ongoing support services described in Exhibit A.',
        useCase: 'Engagements including implementation',
        isPreApproved: true,
      },
    ],
  },
];

// Mock request log
interface RequestLog {
  id: string;
  clauseId: string;
  clauseTitle: string;
  type: 'alternative_applied' | 'change_requested' | 'pending';
  description: string;
  timestamp: Date;
  status: 'applied' | 'pending_review' | 'approved' | 'rejected';
}

const initialRequestLog: RequestLog[] = [
  {
    id: 'req-1',
    clauseId: '2',
    clauseTitle: 'Payment Terms',
    type: 'alternative_applied',
    description: 'Changed to Net 45 Extended terms',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'applied',
  },
];

export function NegotiationTab() {
  const [selectedClause, setSelectedClause] = useState<ClauseConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clauses, setClauses] = useState<ClauseConfig[]>(mockClauses);
  const [requestLog, setRequestLog] = useState<RequestLog[]>(initialRequestLog);
  const [viewMode, setViewMode] = useState<'document' | 'list'>('document');

  const handleClauseClick = (clause: ClauseConfig) => {
    setSelectedClause(clause);
    setModalOpen(true);
  };

  const handleSelectAlternative = (clauseId: string, alternativeId: string) => {
    const clause = clauses.find(c => c.clauseId === clauseId);
    const alternative = clause?.alternatives.find(a => a.id === alternativeId);
    
    if (clause && alternative) {
      // Update the clause text
      setClauses(prev => prev.map(c => 
        c.clauseId === clauseId 
          ? { ...c, currentText: alternative.text }
          : c
      ));
      
      // Add to request log
      setRequestLog(prev => [{
        id: `req-${Date.now()}`,
        clauseId,
        clauseTitle: clause.clauseTitle,
        type: 'alternative_applied',
        description: `Applied: ${alternative.label}`,
        timestamp: new Date(),
        status: 'applied',
      }, ...prev]);
    }
  };

  const handleSubmitChangeRequest = (clauseId: string, proposedChange: string, justification: string) => {
    const clause = clauses.find(c => c.clauseId === clauseId);
    
    if (clause) {
      setRequestLog(prev => [{
        id: `req-${Date.now()}`,
        clauseId,
        clauseTitle: clause.clauseTitle,
        type: 'change_requested',
        description: proposedChange.substring(0, 100) + (proposedChange.length > 100 ? '...' : ''),
        timestamp: new Date(),
        status: 'pending_review',
      }, ...prev]);
      
      toast.info('Change request submitted for legal review');
    }
  };

  const getStatusIcon = (status: RequestLog['status']) => {
    switch (status) {
      case 'applied':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <Check className="h-4 w-4 text-primary" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: RequestLog['status']) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'pending_review':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Contract Negotiation</h2>
          <p className="text-sm text-muted-foreground">
            Click on clauses to view alternatives or request changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'document' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('document')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Document
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            Clause List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Contract Preview or List */}
        <div className="col-span-2">
          {viewMode === 'document' ? (
            <ContractPreview 
              clauses={clauses} 
              onClauseClick={handleClauseClick} 
            />
          ) : (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg">All Clauses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clauses.map((clause) => (
                  <div
                    key={clause.clauseId}
                    onClick={() => handleClauseClick(clause)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      clause.status === 'locked'
                        ? 'border-border hover:border-destructive/50 hover:bg-destructive/5'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {clause.clauseNumber}. {clause.clauseTitle}
                        </span>
                        <Badge 
                          variant={clause.status === 'locked' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {clause.status === 'locked' ? 'Locked' : 'Modifiable'}
                        </Badge>
                      </div>
                      {clause.status !== 'locked' && (
                        <span className="text-xs text-muted-foreground">
                          {clause.alternatives.length} alternatives
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Request Log */}
        <div className="space-y-4">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5" />
                  Change Log
                </CardTitle>
                <Badge variant="secondary">{requestLog.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {requestLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No changes logged yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {requestLog.map((request) => (
                      <div 
                        key={request.id}
                        className="p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {request.clauseTitle}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            <span className="text-xs text-muted-foreground">
                              {getStatusLabel(request.status)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {request.description}
                        </p>
                        <span className="text-xs text-muted-foreground/70">
                          {request.timestamp.toLocaleDateString()} at{' '}
                          {request.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border border-border">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold text-primary">
                    {clauses.filter(c => c.status === 'modifiable').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Modifiable</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-destructive">
                    {clauses.filter(c => c.status === 'locked').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Locked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clause Modification Modal */}
      <ClauseModificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clause={selectedClause}
        onSelectAlternative={handleSelectAlternative}
        onSubmitChangeRequest={handleSubmitChangeRequest}
      />
    </div>
  );
}
