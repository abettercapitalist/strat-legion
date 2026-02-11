import type { WorkflowRFNode } from './types';
import { BRICK_LABELS } from './utils';

/** Map template_id to short display names for subject extraction */
const TEMPLATE_NAMES: Record<string, string> = {
  nda: 'NDA',
  msa: 'MSA',
  sow: 'Statement of Work',
  order_form: 'Order Form',
};

/** Common verb prefixes to strip for clean noun phrases */
const VERB_PREFIXES = ['generate', 'create', 'draft', 'gather', 'collect', 'get', 'build'];

/**
 * Extract a clean, natural noun phrase from a node for labeling downstream nodes.
 * e.g. Documentation with template_id "nda" → "NDA"
 *      "Gather Deal Info" → "Deal Info"
 */
function extractSubject(node: WorkflowRFNode): string {
  const category = node.data.brickCategory;

  // Documentation bricks: use template name if available
  if (category === 'documentation') {
    const templateId = node.data.config.template_id as string | undefined;
    if (templateId && TEMPLATE_NAMES[templateId]) {
      return TEMPLATE_NAMES[templateId];
    }
  }

  // Strip common verb prefixes from the label
  const label = node.data.label;
  const lowerLabel = label.toLowerCase();
  for (const prefix of VERB_PREFIXES) {
    if (lowerLabel.startsWith(prefix + ' ')) {
      return label.slice(prefix.length + 1).trim();
    }
  }

  return label;
}

/**
 * Auto-configure a target node when an edge is drawn from source → target.
 * All rules are non-destructive: they only set config fields that are empty.
 */
export function autoConfigureOnConnect(
  sourceNode: WorkflowRFNode,
  targetNode: WorkflowRFNode,
  setNodes: React.Dispatch<React.SetStateAction<WorkflowRFNode[]>>,
): void {
  const sourceCat = sourceNode.data.brickCategory;
  const targetCat = targetNode.data.brickCategory;
  const targetConfig = targetNode.data.config;

  const updates: Record<string, unknown> = {};
  let newLabel: string | undefined;

  const subject = extractSubject(sourceNode);
  const isDefaultLabel = targetNode.data.label === BRICK_LABELS[targetCat];

  // Documentation → Review: auto-label + auto-set document_id
  if (sourceCat === 'documentation' && targetCat === 'review') {
    if (isDefaultLabel) {
      newLabel = `Review ${subject}`;
    }
    if (!targetConfig.document_id) {
      updates.document_id = sourceNode.id;
    }
  }

  // Documentation → Approval: auto-set document_id
  if (sourceCat === 'documentation' && targetCat === 'approval') {
    if (!targetConfig.document_id) {
      updates.document_id = sourceNode.id;
    }
  }

  // Documentation → Commitment: set document_source + document_id
  if (sourceCat === 'documentation' && targetCat === 'commitment') {
    if (!targetConfig.document_source) {
      updates.document_source = 'previous_brick';
    }
    if (!targetConfig.document_id) {
      updates.document_id = sourceNode.id;
    }
  }

  // Collection → Review: auto-label
  if (sourceCat === 'collection' && targetCat === 'review') {
    if (isDefaultLabel) {
      newLabel = `Review ${subject}`;
    }
  }

  // Apply updates if any
  if (Object.keys(updates).length === 0 && !newLabel) return;

  setNodes((nds) =>
    nds.map((n) => {
      if (n.id !== targetNode.id) return n;
      return {
        ...n,
        data: {
          ...n.data,
          ...(newLabel ? { label: newLabel } : {}),
          config: { ...n.data.config, ...updates },
        },
      };
    })
  );
}
