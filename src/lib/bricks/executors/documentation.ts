/**
 * Documentation Brick Executor
 *
 * Generates documents from templates via the `generate-document` edge function,
 * handles async waiting for document generation, and resumes on completion.
 * Absorbs: generate_document, store_document, send_document, validate_document
 */

import { supabase } from '@/integrations/supabase/client';
import type { BrickExecutor, DocumentationBrickConfig } from '../types';

/**
 * Documentation executor: invokes the generate-document edge function,
 * waits for generation to complete, and returns document outputs.
 */
export const documentationExecutor: BrickExecutor = async (inputs, context) => {
  const config = (inputs._brick_config || inputs) as Partial<DocumentationBrickConfig>;

  // Check if document generation has already been initiated (resume path)
  const existingDocumentId = context.play_config.document_id ??
                              context.previous_outputs.document_id;

  if (existingDocumentId) {
    // Poll document status from workstream_documents table
    const { data: doc, error: fetchError } = await supabase
      .from('workstream_documents')
      .select('*')
      .eq('id', existingDocumentId as string)
      .single();

    if (fetchError || !doc) {
      return {
        status: 'failed',
        outputs: { document_id: existingDocumentId },
        error: fetchError?.message || 'Document not found',
      };
    }

    if (doc.status === 'ready' || doc.status === 'completed') {
      return {
        status: 'completed',
        outputs: {
          document_id: doc.id,
          document_url: doc.storage_path,
          format: doc.file_format,
          name: doc.title,
          template_used: doc.template_id,
          status: doc.status,
          generated_at: doc.updated_at || doc.created_at,
        },
      };
    }

    if (doc.status === 'error' || doc.status === 'failed') {
      return {
        status: 'failed',
        outputs: { document_id: doc.id },
        error: doc.error_message || 'Document generation failed',
      };
    }

    // Still generating — stay in waiting state
    return {
      status: 'waiting_for_event',
      outputs: {
        document_id: doc.id,
        status: doc.status,
      },
      pending_action: {
        type: 'documentation',
        brick_id: 'documentation',
        brick_name: 'Documentation',
        node_id: context.execution.node_id,
        description: 'Generating document...',
        config: {
          document_id: doc.id,
          status: doc.status,
          template_id: config.template_id,
          output_name: config.output_name || doc.title,
          workstream_id: context.workstream.id,
          play_id: context.execution.play_id,
        },
      },
    };
  }

  // First run: validate template and invoke the edge function
  const templateId = config.template_id;
  if (!templateId) {
    return {
      status: 'failed',
      outputs: {},
      error: 'Documentation brick requires a template_id in config',
    };
  }

  const documentType = config.output_format || 'docx';
  const title = config.output_name || `Document_${Date.now()}`;

  const { data: fnResult, error: fnError } = await supabase.functions.invoke(
    'generate-document',
    {
      body: {
        workstream_id: context.workstream.id,
        step_id: context.execution.node_id,
        template_id: templateId,
        document_type: documentType,
        title,
        field_mapping: config.field_mapping || {},
      },
    }
  );

  if (fnError) {
    return {
      status: 'failed',
      outputs: {},
      error: `Edge function error: ${fnError.message}`,
    };
  }

  const documentId = fnResult?.document_id || fnResult?.id;

  if (!documentId) {
    return {
      status: 'failed',
      outputs: {},
      error: 'Edge function did not return a document_id',
    };
  }

  // Document generation initiated — wait for completion
  return {
    status: 'waiting_for_event',
    outputs: {
      document_id: documentId,
      status: 'generating',
    },
    pending_action: {
      type: 'documentation',
      brick_id: 'documentation',
      brick_name: 'Documentation',
      node_id: context.execution.node_id,
      description: 'Generating document...',
      config: {
        document_id: documentId,
        status: 'generating',
        template_id: templateId,
        output_name: title,
        workstream_id: context.workstream.id,
        play_id: context.execution.play_id,
      },
    },
  };
};
