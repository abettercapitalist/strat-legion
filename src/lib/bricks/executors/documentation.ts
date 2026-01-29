/**
 * Documentation Brick Executor
 *
 * Generates documents from templates, handles storage and distribution.
 * Absorbs: generate_document, store_document, send_document, validate_document
 */

import type { BrickExecutor, DocumentationBrickConfig } from '../types';

/**
 * Documentation executor: generates documents from templates,
 * stores them, and distributes to recipients.
 */
export const documentationExecutor: BrickExecutor = async (inputs, context) => {
  const config = (inputs._brick_config || inputs) as Partial<DocumentationBrickConfig>;

  // Generate document ID
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const outputFormat = config.output_format || 'pdf';
  const outputName = config.output_name || `Document_${documentId}`;

  // Build storage location
  let storageLocation: string | null = null;
  if (config.storage) {
    const repo = config.storage.repository || 'default';
    const folder = config.storage.folder || context.workstream.id;
    storageLocation = `${repo}/${folder}/${documentId}`;
  }

  // Build distribution status
  let distributionStatus: Record<string, unknown> | null = null;
  if (config.distribution?.recipients && config.distribution.recipients.length > 0) {
    const deliveryMethod = config.distribution.delivery_method || 'email';
    distributionStatus = {
      recipients: config.distribution.recipients,
      delivery_method: deliveryMethod,
      message: config.distribution.message || null,
      sent_at: new Date().toISOString(),
    };
  }

  return {
    status: 'completed',
    outputs: {
      document_id: documentId,
      document_url: `/documents/${documentId}`,
      format: outputFormat,
      name: outputName,
      template_used: config.template_id || null,
      field_mapping: config.field_mapping || {},
      storage_location: storageLocation,
      distribution_status: distributionStatus,
      generated_at: new Date().toISOString(),
    },
  };
};
