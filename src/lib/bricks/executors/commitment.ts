/**
 * Commitment Brick Executor
 *
 * Manages e-signature workflows including signer ordering,
 * reminders, and completion tracking.
 * Absorbs: collect_signature
 */

import type { BrickExecutor, CommitmentBrickConfig } from '../types';

/**
 * Commitment executor: handles e-signature collection via DocuSign or manual signing.
 */
export const commitmentExecutor: BrickExecutor = async (inputs, context) => {
  const config = (inputs._brick_config || inputs) as Partial<CommitmentBrickConfig>;
  const provider = config.provider || 'manual';
  const signers = config.signers || [];
  const documentSource = config.document_source || 'previous_brick';

  // Check if all signatures have been collected
  const signaturesComplete = context.play_config.signatures_complete ??
                             context.previous_outputs.signatures_complete;

  if (signaturesComplete) {
    return {
      status: 'completed',
      outputs: {
        all_signed: true,
        signatures: context.play_config.signatures ?? [],
        envelope_id: context.play_config.envelope_id ?? null,
        signed_document_url: context.play_config.signed_document_url ?? null,
        completed_at: new Date().toISOString(),
      },
    };
  }

  // Determine document ID from config or previous outputs
  const documentId = config.document_id ??
                     context.previous_outputs.document_id ??
                     context.play_config.document_id;

  const envelopeId = `sig_${Date.now()}`;

  // Pause waiting for signatures
  return {
    status: 'waiting_for_event',
    outputs: {
      envelope_id: envelopeId,
      document_id: documentId,
      requested_at: new Date().toISOString(),
    },
    pending_action: {
      type: 'commitment',
      brick_id: 'commitment',
      brick_name: 'Commitment',
      node_id: context.execution.node_id,
      description: 'Document signature required',
      config: {
        provider,
        signers,
        document_source: documentSource,
        document_id: documentId,
        signature_placement: config.signature_placement,
        reminders: config.reminders,
        workstream_id: context.workstream.id,
      },
    },
  };
};
