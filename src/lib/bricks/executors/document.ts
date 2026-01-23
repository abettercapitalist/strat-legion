/**
 * Document Brick Executors
 *
 * Executors for document generation, storage, and management bricks.
 * Bricks: generate_document, collect_document, validate_document,
 *         store_document, send_document, collect_signature
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// GENERATE DOCUMENT
// ============================================================================

const generateDocument: BrickExecutor = async (inputs, context) => {
  const { template_id, data_mapping, output_format, output_name } = inputs;

  // In a real implementation, this would call the document generation service
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    status: 'completed',
    outputs: {
      document_id: documentId,
      document_url: `/documents/${documentId}`,
      template_used: template_id,
      format: output_format || 'docx',
      name: output_name || `Document_${documentId}`,
      generated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// COLLECT DOCUMENT
// ============================================================================

const collectDocument: BrickExecutor = async (inputs, context) => {
  const { document_type, required, accepted_formats, max_size_mb } = inputs;

  // Check if document has already been provided
  const existingDocument = context.play_config.uploaded_document_id ??
                          context.previous_outputs.document_id;

  if (existingDocument) {
    return {
      status: 'completed',
      outputs: {
        document_id: existingDocument,
        document_metadata: context.play_config.document_metadata || {},
        uploaded_at: context.play_config.uploaded_at ?? new Date().toISOString(),
      },
    };
  }

  // This brick pauses execution waiting for document upload
  return {
    status: 'waiting_for_input',
    outputs: {},
    pending_action: {
      type: 'document',
      brick_id: 'collect_document',
      brick_name: 'Collect Document',
      node_id: context.execution.node_id,
      description: `Please upload: ${document_type}`,
      config: {
        document_type,
        required: required !== false,
        accepted_formats: accepted_formats || ['pdf', 'docx', 'doc'],
        max_size_mb: max_size_mb || 10,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// VALIDATE DOCUMENT
// ============================================================================

const validateDocument: BrickExecutor = async (inputs, context) => {
  const { document_id, validation_criteria, required_fields } = inputs;

  // In a real implementation, this would validate the document content
  // For now, return a successful validation
  return {
    status: 'completed',
    outputs: {
      is_valid: true,
      validation_details: {
        criteria_checked: validation_criteria || {},
        required_fields_present: required_fields || [],
      },
      document_id: document_id,
      validated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// STORE DOCUMENT
// ============================================================================

const storeDocument: BrickExecutor = async (inputs, context) => {
  const { document_id, repository, folder, access_permissions } = inputs;

  // In a real implementation, this would move/copy the document to storage
  const storageLocation = `${repository || 'default'}/${folder || context.workstream.id}/${document_id}`;

  return {
    status: 'completed',
    outputs: {
      storage_location: storageLocation,
      storage_status: true,
      document_id: document_id,
      repository: repository || 'default',
      folder: folder || context.workstream.id,
      access_permissions: access_permissions || {},
      stored_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// SEND DOCUMENT
// ============================================================================

const sendDocument: BrickExecutor = async (inputs, context) => {
  const { document_id, recipients, delivery_method, message } = inputs;

  const deliveryId = `delivery_${Date.now()}`;
  const recipientList = Array.isArray(recipients) ? recipients : [recipients];

  // In a real implementation, this would send the document via the specified method
  return {
    status: 'completed',
    outputs: {
      delivery_status: true,
      delivery_id: deliveryId,
      document_id: document_id,
      recipients: recipientList,
      delivery_method: delivery_method || 'email',
      message: message,
      sent_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// COLLECT SIGNATURE
// ============================================================================

const collectSignature: BrickExecutor = async (inputs, context) => {
  const { document_id, signers, signature_order, due_date } = inputs;

  // Check if signatures have been collected
  const signaturesComplete = context.play_config.signatures_complete;

  if (signaturesComplete) {
    return {
      status: 'completed',
      outputs: {
        all_signed: true,
        signatures: context.play_config.signatures || [],
        completed_at: new Date().toISOString(),
      },
    };
  }

  const signatureRequestId = `sig_${Date.now()}`;
  const signerList = Array.isArray(signers) ? signers : [signers];

  // This brick pauses waiting for signatures
  return {
    status: 'waiting_for_event',
    outputs: {
      signature_request_id: signatureRequestId,
      document_id: document_id,
      requested_at: new Date().toISOString(),
    },
    pending_action: {
      type: 'signature',
      brick_id: 'collect_signature',
      brick_name: 'Collect Signature',
      node_id: context.execution.node_id,
      description: 'Document signature required',
      config: {
        document_id,
        signers: signerList,
        signature_order: signature_order || 'parallel',
        due_date,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const documentExecutors: BrickRegistry = {
  generate_document: generateDocument,
  collect_document: collectDocument,
  validate_document: validateDocument,
  store_document: storeDocument,
  send_document: sendDocument,
  collect_signature: collectSignature,
};
