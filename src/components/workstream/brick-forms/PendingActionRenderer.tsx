import type { BrickCategory } from '@/lib/bricks/types';
import { CollectionForm } from './CollectionForm';
import { ApprovalForm } from './ApprovalForm';
import { ReviewForm } from './ReviewForm';
import { DocumentationForm } from './DocumentationForm';
import { CommitmentForm } from './CommitmentForm';

interface PendingActionRendererProps {
  category: BrickCategory;
  config: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function PendingActionRenderer({ category, config, onSubmit, isSubmitting }: PendingActionRendererProps) {
  switch (category) {
    case 'collection':
      return <CollectionForm config={config} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
    case 'approval':
      return <ApprovalForm config={config} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
    case 'review':
      return <ReviewForm config={config} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
    case 'documentation':
      return <DocumentationForm config={config} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
    case 'commitment':
      return <CommitmentForm config={config} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
    default:
      return <p className="text-sm text-muted-foreground">Unknown action type.</p>;
  }
}
