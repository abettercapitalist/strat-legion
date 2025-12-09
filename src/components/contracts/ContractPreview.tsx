import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import { ClauseConfig } from './ClauseModificationModal';

interface ContractPreviewProps {
  clauses: ClauseConfig[];
  onClauseClick: (clause: ClauseConfig) => void;
}

export function ContractPreview({ clauses, onClauseClick }: ContractPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['terms', 'definitions']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Group clauses by section
  const termsClauses = clauses.filter(c => !c.clauseNumber.startsWith('D'));
  const definitionsClauses = clauses.filter(c => c.clauseNumber.startsWith('D'));

  return (
    <Card className="border border-border bg-card">
      {/* Contract Header */}
      <div className="p-8 border-b border-border text-center space-y-4">
        <h2 className="text-2xl font-semibold tracking-wide uppercase">
          Master Services Agreement
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          This agreement is between TestCo, Inc., a Utah corporation, and Acme Corp, 
          a Delaware corporation. The parties agree as follows:
        </p>
      </div>

      {/* Terms and Conditions Section */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection('terms')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <span className="font-semibold text-lg">Terms and Conditions</span>
          {expandedSections.includes('terms') ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        {expandedSections.includes('terms') && (
          <div className="px-6 pb-6 space-y-2">
            {termsClauses.map((clause) => (
              <ClauseBlock 
                key={clause.clauseId} 
                clause={clause} 
                onClick={() => onClauseClick(clause)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Definitions Section */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection('definitions')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <span className="font-semibold text-lg">Definitions</span>
          {expandedSections.includes('definitions') ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        {expandedSections.includes('definitions') && (
          <div className="px-6 pb-6 space-y-2">
            {definitionsClauses.map((clause) => (
              <ClauseBlock 
                key={clause.clauseId} 
                clause={clause} 
                onClick={() => onClauseClick(clause)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Signature Block */}
      <div className="p-8">
        <h3 className="font-semibold text-lg mb-6">Effectiveness</h3>
        <p className="text-sm text-muted-foreground mb-8">
          This Agreement becomes effective when both parties have signed it. The date of this 
          Agreement will be the date on which the last party signs.
        </p>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="font-medium">TestCo, Inc.</div>
            <div className="border-b border-border pt-8" />
            <div className="text-sm text-muted-foreground">Signature</div>
            <div className="border-b border-border pt-4" />
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="border-b border-border pt-4" />
            <div className="text-sm text-muted-foreground">Title</div>
            <div className="border-b border-border pt-4" />
            <div className="text-sm text-muted-foreground">Date</div>
          </div>
          <div className="space-y-4">
            <div className="font-medium">Acme Corp</div>
            <div className="border-b border-border pt-8" />
            <div className="text-sm text-muted-foreground">Signature</div>
            <div className="border-b border-border pt-4" />
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="border-b border-border pt-4" />
            <div className="text-sm text-muted-foreground">Title</div>
            <div className="border-b border-border pt-4" />
            <div className="text-sm text-muted-foreground">Date</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface ClauseBlockProps {
  clause: ClauseConfig;
  onClick: () => void;
}

function ClauseBlock({ clause, onClick }: ClauseBlockProps) {
  const isLocked = clause.status === 'locked';
  
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all group ${
        isLocked 
          ? 'border-border hover:border-destructive/50 hover:bg-destructive/5' 
          : 'border-border hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {clause.clauseNumber}. {clause.clauseTitle}
            </span>
            {isLocked ? (
              <Lock className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {clause.currentText}
          </p>
        </div>
        <Badge 
          variant={isLocked ? 'destructive' : 'secondary'} 
          className="shrink-0 text-xs"
        >
          {isLocked ? 'Locked' : `${clause.alternatives.length} options`}
        </Badge>
      </div>
    </div>
  );
}
