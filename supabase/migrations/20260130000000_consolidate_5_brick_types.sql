-- ============================================================================
-- CONSOLIDATE 5 BRICK TYPES
-- Migration: 20260130000000_consolidate_5_brick_types.sql
--
-- Consolidates the 26-brick / 18-category architecture down to 5 brick types:
--   collection, review, approval, documentation, commitment
--
-- Changes:
-- 1. Clear dependent tables (step_definition_bricks)
-- 2. Delete all existing bricks and brick_categories
-- 3. Insert 5 new categories
-- 4. Insert 5 new bricks with rich input/output schemas
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CLEAR DEPENDENT DATA
-- ============================================================================

DELETE FROM public.step_definition_bricks;
DELETE FROM public.bricks;
DELETE FROM public.brick_categories;

-- ============================================================================
-- STEP 2: INSERT 5 NEW CATEGORIES
-- ============================================================================

INSERT INTO public.brick_categories (id, name, display_name, description, display_order, icon) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'collection',    'Collection',    'Gather structured information, documents, or decisions from users',                  1, '📋'),
  ('a0000000-0000-0000-0000-000000000002', 'review',        'Review',        'Evaluate information against defined criteria with pass/fail routing',                2, '🔍'),
  ('a0000000-0000-0000-0000-000000000003', 'approval',      'Approval',      'Request and track authorization decisions with auto-approval and escalation',         3, '✅'),
  ('a0000000-0000-0000-0000-000000000004', 'documentation', 'Documentation', 'Generate documents from templates, store in repositories, and distribute',            4, '📄'),
  ('a0000000-0000-0000-0000-000000000005', 'commitment',    'Commitment',    'Manage e-signature workflows including signer ordering and completion tracking',      5, '✍️');

-- ============================================================================
-- STEP 3: INSERT 5 NEW BRICKS
-- ============================================================================

-- COLLECTION: Gather structured information from users
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container, is_active) VALUES (
  'collection',
  'Collection',
  'Gather structured information, documents, or decisions from a user via configurable form fields with validation',
  'a0000000-0000-0000-0000-000000000001',
  1,
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
  '{}'::text[],
  'none',
  false,
  true
);

-- REVIEW: Evaluate collected information against defined criteria
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container, is_active) VALUES (
  'review',
  'Review',
  'Evaluate information against defined criteria using checklist, scored, or qualitative review methods with pass/fail routing',
  'a0000000-0000-0000-0000-000000000002',
  2,
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
  '{}'::text[],
  'none',
  false,
  true
);

-- APPROVAL: Get authorization/decision from an approver
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container, is_active) VALUES (
  'approval',
  'Approval',
  'Request and track authorization decisions with support for auto-approval rules, escalation, and delegation',
  'a0000000-0000-0000-0000-000000000003',
  3,
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
  '{}'::text[],
  'none',
  false,
  true
);

-- DOCUMENTATION: Generate and distribute documents from workflow data
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container, is_active) VALUES (
  'documentation',
  'Documentation',
  'Generate documents from templates, store in repositories, and distribute to stakeholders',
  'a0000000-0000-0000-0000-000000000004',
  4,
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
  '{}'::text[],
  'none',
  false,
  true
);

-- COMMITMENT: Obtain signatures and final commitments
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container, is_active) VALUES (
  'commitment',
  'Commitment',
  'Manage e-signature workflows including signer ordering, reminders, and completion tracking',
  'a0000000-0000-0000-0000-000000000005',
  5,
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
  '{}'::text[],
  'none',
  false,
  true
);

COMMIT;
