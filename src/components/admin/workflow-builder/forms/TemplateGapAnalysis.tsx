import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { AnalyzedVariable } from '../templateAnalysis';

interface TemplateGapAnalysisProps {
  variables: AnalyzedVariable[];
}

export function TemplateGapAnalysis({ variables }: TemplateGapAnalysisProps) {
  const resolved = variables.filter((v) => v.status === 'resolved');
  const unresolved = variables.filter((v) => v.status === 'unresolved');

  return (
    <div className="space-y-2">
      {/* Summary line */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {resolved.length}/{variables.length} variables covered
        </span>
        {unresolved.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium text-[10px]">
            {unresolved.length} missing
          </span>
        )}
      </div>

      {/* Variable list — unresolved first */}
      <div className="space-y-1">
        {unresolved.map((v) => (
          <div
            key={v.raw}
            className="flex items-start gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200"
          >
            <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <code className="text-[11px] font-mono text-amber-800">{`{{${v.raw}}}`}</code>
              <p className="text-[10px] text-amber-600">{v.sourceLabel}</p>
            </div>
          </div>
        ))}
        {resolved.map((v) => (
          <div
            key={v.raw}
            className="flex items-start gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200"
          >
            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <code className="text-[11px] font-mono text-green-800">{`{{${v.raw}}}`}</code>
              <p className="text-[10px] text-green-600">{v.sourceLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
