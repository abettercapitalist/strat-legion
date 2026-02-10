import type { BrickCategory, BrickOutputField } from '@/lib/bricks/types';

// Re-export for convenience
export type { BrickOutputField } from '@/lib/bricks/types';

/**
 * Static output schemas for each brick category.
 * Derived from each executor's actual output object.
 */
export const BRICK_OUTPUT_SCHEMAS: Record<BrickCategory, BrickOutputField[]> = {
  collection: [
    { name: 'collected_values', type: 'object', description: 'All collected field values as key-value pairs' },
    { name: 'collected_at', type: 'timestamp', description: 'When the data was collected' },
    { name: 'collected_by', type: 'uuid', description: 'User who submitted the collection' },
  ],
  review: [
    { name: 'review_outcome', type: 'string', description: 'Overall outcome: pass, fail, or needs_revision' },
    { name: 'criteria_results', type: 'array', description: 'Individual criterion results' },
    { name: 'score', type: 'number', description: 'Aggregate review score (scored reviews)' },
    { name: 'reviewer_comments', type: 'string', description: 'Free-text reviewer comments' },
  ],
  approval: [
    { name: 'decision', type: 'string', description: 'Approval decision: approved, rejected, or escalated' },
    { name: 'reasoning', type: 'string', description: 'Approver reasoning or comments' },
    { name: 'auto_approved', type: 'boolean', description: 'Whether auto-approval rules applied' },
    { name: 'decided_by', type: 'uuid', description: 'User who made the decision' },
  ],
  documentation: [
    { name: 'document_id', type: 'uuid', description: 'ID of the generated document' },
    { name: 'document_url', type: 'string', description: 'URL to access the document' },
    { name: 'format', type: 'string', description: 'Output format (pdf, docx, html)' },
    { name: 'name', type: 'string', description: 'Document name' },
    { name: 'template_used', type: 'string', description: 'Template ID used to generate' },
  ],
  commitment: [
    { name: 'all_signed', type: 'boolean', description: 'Whether all signers have signed' },
    { name: 'signed_document_url', type: 'string', description: 'URL to the fully-signed document' },
    { name: 'envelope_id', type: 'string', description: 'Signature provider envelope/tracking ID' },
  ],
};

/** Represents available outputs from a single upstream node */
export interface UpstreamOutput {
  nodeId: string;
  nodeLabel: string;
  brickCategory: BrickCategory;
  fields: BrickOutputField[];
}

/** A reference to a specific output from an upstream node */
export interface InputRef {
  node_id: string;
  node_label: string;
  output_key: string;
  output_label: string;
}
