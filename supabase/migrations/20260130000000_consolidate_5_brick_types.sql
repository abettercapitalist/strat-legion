-- ============================================================================
-- CONSOLIDATE 5 BRICK TYPES
-- Migration: 20260130000000_consolidate_5_brick_types.sql
--
-- Consolidates the 26-brick / 6-category architecture down to 5 brick types:
--   collection, review, approval, documentation, commitment
--
-- Changes:
-- 1. Delete all 26 existing brick rows
-- 2. Update brick_category CHECK constraint to 5 types
-- 3. Insert 5 new bricks with rich input/output schemas
-- ============================================================================

-- ============================================================================
-- STEP 1: DELETE EXISTING BRICKS
-- ============================================================================

DELETE FROM public.bricks;

-- ============================================================================
-- STEP 2: UPDATE CATEGORY CONSTRAINT
-- ============================================================================

ALTER TABLE public.bricks DROP CONSTRAINT IF EXISTS bricks_brick_category_check;
ALTER TABLE public.bricks ADD CONSTRAINT bricks_brick_category_check
  CHECK (brick_category IN ('collection', 'review', 'approval', 'documentation', 'commitment'));

-- ============================================================================
-- STEP 3: INSERT 5 NEW BRICK TYPES
-- ============================================================================

-- COLLECTION: Gather structured information from users
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema, metadata) VALUES (
  'collection',
  'Collection',
  'Gather structured information, documents, or decisions from a user via configurable form fields with validation',
  'collection',
  '{
    "fields": [
      {"name": "owner_assignment", "type": "object", "required": false, "description": "Who is responsible for completing this collection (role or user ID)"},
      {"name": "fields", "type": "array", "required": true, "description": "Array of CollectionField objects defining what to collect. Supported field_types: text, textarea, number, currency, date, select, multi_select, checkbox, file, meeting_request, decision, assignment"},
      {"name": "validation_rules", "type": "object", "required": false, "description": "Cross-field validation rules to apply after individual field validation"},
      {"name": "sla", "type": "object", "required": false, "description": "SLA configuration: deadline_hours, warning_hours, escalation"},
      {"name": "notifications", "type": "object", "required": false, "description": "Notification triggers: on_assigned, on_sla_warning, on_completed"}
    ]
  }'::jsonb,
  '{
    "fields": [
      {"name": "collected_values", "type": "object", "description": "Key-value map of all collected field values"},
      {"name": "collected_at", "type": "timestamp", "description": "When collection was completed"},
      {"name": "collected_by", "type": "uuid", "description": "User who completed the collection"},
      {"name": "validation_passed", "type": "boolean", "description": "Whether all validation rules passed"}
    ]
  }'::jsonb,
  '{"absorbs": ["collect_data", "validate_data", "retrieve_data", "collect_document", "request_meeting", "record_decision", "assign_ownership"]}'::jsonb
);

-- REVIEW: Evaluate collected information against defined criteria
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema, metadata) VALUES (
  'review',
  'Review',
  'Evaluate information against defined criteria using checklist, scored, or qualitative review methods with pass/fail routing',
  'review',
  '{
    "fields": [
      {"name": "review_type", "type": "string", "required": true, "description": "Type of review: checklist, scored, or qualitative", "options": ["checklist", "scored", "qualitative"]},
      {"name": "criteria", "type": "array", "required": true, "description": "Array of review criteria objects with label, description, and weight (for scored)"},
      {"name": "outcome_routing", "type": "object", "required": false, "description": "Routing rules: on_pass (continue|route), on_fail (stop|send_back|alternate_path), target node IDs"},
      {"name": "reviewer_assignment", "type": "object", "required": false, "description": "Who performs the review (role or user ID)"},
      {"name": "sla", "type": "object", "required": false, "description": "SLA configuration for review completion"}
    ]
  }'::jsonb,
  '{
    "fields": [
      {"name": "review_outcome", "type": "string", "description": "pass or fail"},
      {"name": "criteria_results", "type": "array", "description": "Per-criterion results with pass/fail and comments"},
      {"name": "score", "type": "number", "description": "Numeric score for scored reviews"},
      {"name": "reviewer_comments", "type": "string", "description": "Overall reviewer comments"},
      {"name": "reviewed_by", "type": "uuid", "description": "User who performed the review"},
      {"name": "reviewed_at", "type": "timestamp", "description": "When review was completed"}
    ]
  }'::jsonb,
  '{"absorbs": ["require_peer_review", "validate_document"]}'::jsonb
);

-- APPROVAL: Get authorization/decision from an approver
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema, metadata) VALUES (
  'approval',
  'Approval',
  'Request and track authorization decisions with support for auto-approval rules, escalation, and delegation',
  'approval',
  '{
    "fields": [
      {"name": "approver", "type": "object", "required": true, "description": "Approver assignment: role-based or specific user ID"},
      {"name": "conditional_logic", "type": "array", "required": false, "description": "Auto-approval rules: conditions array with field, operator, value, and logic (AND/OR)"},
      {"name": "decision_options", "type": "array", "required": false, "description": "Available decisions, default: [approve, reject, request_more_info]"},
      {"name": "escalation", "type": "object", "required": false, "description": "Escalation config: escalate_after_hours, escalate_to_role, escalation_reason"},
      {"name": "delegation", "type": "object", "required": false, "description": "Delegation config: allow_delegation, delegate_to_roles"},
      {"name": "sla", "type": "object", "required": false, "description": "SLA configuration for approval deadline"}
    ]
  }'::jsonb,
  '{
    "fields": [
      {"name": "decision", "type": "string", "description": "The approval decision (approve, reject, etc.)"},
      {"name": "reasoning", "type": "string", "description": "Rationale for the decision"},
      {"name": "decided_by", "type": "uuid", "description": "User who made the decision"},
      {"name": "decided_at", "type": "timestamp", "description": "When decision was made"},
      {"name": "auto_approved", "type": "boolean", "description": "Whether auto-approval rules triggered"},
      {"name": "escalated", "type": "boolean", "description": "Whether the approval was escalated"},
      {"name": "delegated", "type": "boolean", "description": "Whether the approval was delegated"}
    ]
  }'::jsonb,
  '{"absorbs": ["require_approval", "auto_approve", "escalate_approval", "delegate_approval"]}'::jsonb
);

-- DOCUMENTATION: Generate and distribute documents from workflow data
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema, metadata) VALUES (
  'documentation',
  'Documentation',
  'Generate documents from templates, store in repositories, and distribute to stakeholders',
  'documentation',
  '{
    "fields": [
      {"name": "template_id", "type": "uuid", "required": false, "description": "Library template ID for document generation"},
      {"name": "field_mapping", "type": "object", "required": false, "description": "Map of template fields to workflow data sources"},
      {"name": "output_format", "type": "string", "required": false, "description": "Output format: pdf, docx, html", "options": ["pdf", "docx", "html"]},
      {"name": "storage", "type": "object", "required": false, "description": "Storage config: repository, folder, access_permissions"},
      {"name": "distribution", "type": "object", "required": false, "description": "Distribution config: recipients, delivery_method (email/link), message"},
      {"name": "validation_rules", "type": "object", "required": false, "description": "Document validation criteria to check before finalizing"}
    ]
  }'::jsonb,
  '{
    "fields": [
      {"name": "document_id", "type": "string", "description": "Generated document identifier"},
      {"name": "document_url", "type": "string", "description": "URL to access the document"},
      {"name": "format", "type": "string", "description": "Output format used"},
      {"name": "storage_location", "type": "string", "description": "Where the document was stored"},
      {"name": "distribution_status", "type": "object", "description": "Per-recipient delivery status"},
      {"name": "generated_at", "type": "timestamp", "description": "When the document was generated"}
    ]
  }'::jsonb,
  '{"absorbs": ["generate_document", "store_document", "send_document", "validate_document"]}'::jsonb
);

-- COMMITMENT: Obtain signatures and final commitments
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema, metadata) VALUES (
  'commitment',
  'Commitment',
  'Manage e-signature workflows including signer ordering, reminders, and completion tracking',
  'commitment',
  '{
    "fields": [
      {"name": "provider", "type": "string", "required": false, "description": "Signature provider: docusign or manual", "options": ["docusign", "manual"]},
      {"name": "signers", "type": "array", "required": true, "description": "Array of signer objects: name, email, role, order"},
      {"name": "document_source", "type": "string", "required": true, "description": "Source of document to sign: previous_brick, template, or upload", "options": ["previous_brick", "template", "upload"]},
      {"name": "signature_placement", "type": "array", "required": false, "description": "Where signatures should be placed in the document"},
      {"name": "reminders", "type": "object", "required": false, "description": "Reminder config: frequency_hours, max_reminders, final_warning_hours"}
    ]
  }'::jsonb,
  '{
    "fields": [
      {"name": "all_signed", "type": "boolean", "description": "Whether all signers have completed"},
      {"name": "signatures", "type": "array", "description": "Per-signer status with signed_at timestamp"},
      {"name": "envelope_id", "type": "string", "description": "External signature provider envelope/request ID"},
      {"name": "signed_document_url", "type": "string", "description": "URL to the fully executed document"},
      {"name": "completed_at", "type": "timestamp", "description": "When all signatures were collected"}
    ]
  }'::jsonb,
  '{"absorbs": ["collect_signature"]}'::jsonb
);
