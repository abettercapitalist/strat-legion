-- ============================================================================
-- REFINED BRICK ARCHITECTURE
-- Migration: 20260122000000_refined_brick_architecture.sql
--
-- Replaces the prototype brick architecture (76 bricks, 18 categories, step_definitions)
-- with the refined architecture (26 bricks, 6 categories, patterns/plays/Library system).
--
-- New Tables:
-- - Library System (4): libraries, library_artifacts, library_templates, library_packages
-- - Playbook System (6): playbooks, bricks, playbook_patterns, playbook_plays, workflow_nodes, workflow_edges
-- - Execution System (4): workstream_handoffs, node_execution_state, audit_log, brick_library_references
-- - Transform: workstreams + new columns (play_id, playbook_id, current_node_ids)
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD TABLES
-- ============================================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS public.step_definition_bricks CASCADE;
DROP TABLE IF EXISTS public.step_definitions CASCADE;
DROP TABLE IF EXISTS public.bricks CASCADE;
DROP TABLE IF EXISTS public.brick_categories CASCADE;

-- Drop helper function if exists
DROP FUNCTION IF EXISTS get_brick_category_id(TEXT);

-- ============================================================================
-- STEP 2: LIBRARY SYSTEM TABLES
-- ============================================================================

-- Libraries: A library is a collection of reusable artifacts
CREATE TABLE public.libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  library_type TEXT NOT NULL CHECK (library_type IN ('system', 'organization', 'user')),
  owner_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_libraries_type ON public.libraries(library_type);
CREATE INDEX idx_libraries_owner ON public.libraries(owner_id);

ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active libraries"
  ON public.libraries FOR SELECT
  USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Users can manage own libraries"
  ON public.libraries FOR ALL
  USING (owner_id = auth.uid() OR library_type = 'system');

-- Library Artifacts: Documents, templates, and other reusable content
CREATE TABLE public.library_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('document', 'template', 'clause', 'checklist', 'reference')),
  content JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_artifacts_library ON public.library_artifacts(library_id);
CREATE INDEX idx_library_artifacts_type ON public.library_artifacts(artifact_type);
CREATE INDEX idx_library_artifacts_tags ON public.library_artifacts USING GIN(tags);

ALTER TABLE public.library_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active artifacts"
  ON public.library_artifacts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage artifacts"
  ON public.library_artifacts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Library Templates: Reusable workflow templates
CREATE TABLE public.library_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('playbook', 'pattern', 'play', 'checklist')),
  content JSONB NOT NULL DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_templates_library ON public.library_templates(library_id);
CREATE INDEX idx_library_templates_type ON public.library_templates(template_type);

ALTER TABLE public.library_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.library_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage templates"
  ON public.library_templates FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Library Packages: Bundled collections of artifacts and templates
CREATE TABLE public.library_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  package_contents JSONB NOT NULL DEFAULT '[]', -- Array of {type, id} references
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_packages_library ON public.library_packages(library_id);

ALTER TABLE public.library_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.library_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage packages"
  ON public.library_packages FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 3: PLAYBOOK SYSTEM TABLES
-- ============================================================================

-- Playbooks: Top-level container for workflow definitions
CREATE TABLE public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  workstream_type_id UUID, -- Links to workstream_types
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playbooks_workstream_type ON public.playbooks(workstream_type_id);
CREATE INDEX idx_playbooks_is_template ON public.playbooks(is_template) WHERE is_template = true;

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active playbooks"
  ON public.playbooks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage playbooks"
  ON public.playbooks FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Bricks: Atomic workflow operations (26 bricks, 6 categories)
CREATE TABLE public.bricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  brick_category TEXT NOT NULL CHECK (brick_category IN ('data', 'approval', 'document', 'workflow', 'communication', 'quality')),
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bricks_category ON public.bricks(brick_category);
CREATE INDEX idx_bricks_is_active ON public.bricks(is_active) WHERE is_active = true;

ALTER TABLE public.bricks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bricks"
  ON public.bricks FOR SELECT
  USING (is_active = true);

-- Only system can modify bricks
CREATE POLICY "System can manage bricks"
  ON public.bricks FOR ALL
  USING (auth.uid() IS NOT NULL AND is_system = false);

-- Playbook Patterns: Reusable workflow patterns within a playbook
CREATE TABLE public.playbook_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('sequential', 'parallel', 'conditional', 'loop')),
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playbook_patterns_playbook ON public.playbook_patterns(playbook_id);
CREATE INDEX idx_playbook_patterns_type ON public.playbook_patterns(pattern_type);

ALTER TABLE public.playbook_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active patterns"
  ON public.playbook_patterns FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage patterns"
  ON public.playbook_patterns FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Playbook Plays: Executable workflow steps within a pattern
CREATE TABLE public.playbook_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES public.playbook_patterns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  brick_id UUID REFERENCES public.bricks(id),
  config JSONB NOT NULL DEFAULT '{}',
  input_mapping JSONB DEFAULT '{}',
  output_mapping JSONB DEFAULT '{}',
  execution_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_duration_minutes INTEGER,
  sla_hours INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playbook_plays_pattern ON public.playbook_plays(pattern_id);
CREATE INDEX idx_playbook_plays_brick ON public.playbook_plays(brick_id);

ALTER TABLE public.playbook_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plays"
  ON public.playbook_plays FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage plays"
  ON public.playbook_plays FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Workflow Nodes: DAG nodes for play execution
CREATE TABLE public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID NOT NULL REFERENCES public.playbook_plays(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('start', 'brick', 'fork', 'join', 'end', 'decision')),
  brick_id UUID REFERENCES public.bricks(id),
  config JSONB NOT NULL DEFAULT '{}',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_nodes_play ON public.workflow_nodes(play_id);
CREATE INDEX idx_workflow_nodes_type ON public.workflow_nodes(node_type);

ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow nodes"
  ON public.workflow_nodes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage nodes"
  ON public.workflow_nodes FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Workflow Edges: Connections between workflow nodes
CREATE TABLE public.workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID NOT NULL REFERENCES public.playbook_plays(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'default' CHECK (edge_type IN ('default', 'conditional', 'error')),
  condition JSONB,
  label TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_edges_play ON public.workflow_edges(play_id);
CREATE INDEX idx_workflow_edges_source ON public.workflow_edges(source_node_id);
CREATE INDEX idx_workflow_edges_target ON public.workflow_edges(target_node_id);

ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow edges"
  ON public.workflow_edges FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage edges"
  ON public.workflow_edges FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 4: EXECUTION SYSTEM TABLES
-- ============================================================================

-- Workstream Handoffs: Track handoffs between workstreams
CREATE TABLE public.workstream_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_workstream_id UUID NOT NULL,
  target_workstream_id UUID,
  handoff_type TEXT NOT NULL CHECK (handoff_type IN ('spawn', 'transfer', 'parallel', 'merge')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  handoff_data JSONB DEFAULT '{}',
  initiated_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_workstream_handoffs_source ON public.workstream_handoffs(source_workstream_id);
CREATE INDEX idx_workstream_handoffs_target ON public.workstream_handoffs(target_workstream_id);
CREATE INDEX idx_workstream_handoffs_status ON public.workstream_handoffs(status);

ALTER TABLE public.workstream_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view handoffs"
  ON public.workstream_handoffs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage handoffs"
  ON public.workstream_handoffs FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Node Execution State: Track execution state of workflow nodes
CREATE TABLE public.node_execution_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workstream_id UUID NOT NULL,
  play_id UUID NOT NULL REFERENCES public.playbook_plays(id),
  node_id UUID NOT NULL REFERENCES public.workflow_nodes(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting', 'cancelled')),
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES auth.users(id),
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workstream_id, play_id, node_id)
);

CREATE INDEX idx_node_execution_state_workstream ON public.node_execution_state(workstream_id);
CREATE INDEX idx_node_execution_state_play ON public.node_execution_state(play_id);
CREATE INDEX idx_node_execution_state_status ON public.node_execution_state(status);

ALTER TABLE public.node_execution_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view execution state"
  ON public.node_execution_state FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage execution state"
  ON public.node_execution_state FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Audit Log: Comprehensive audit trail
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  old_values JSONB,
  new_values JSONB,
  context JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log"
  ON public.audit_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Brick Library References: Track which library artifacts are used by bricks
CREATE TABLE public.brick_library_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID NOT NULL REFERENCES public.playbook_plays(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES public.library_artifacts(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('template', 'document', 'clause', 'reference')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(play_id, artifact_id)
);

CREATE INDEX idx_brick_library_refs_play ON public.brick_library_references(play_id);
CREATE INDEX idx_brick_library_refs_artifact ON public.brick_library_references(artifact_id);

ALTER TABLE public.brick_library_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view library references"
  ON public.brick_library_references FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage library references"
  ON public.brick_library_references FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 5: ALTER WORKSTREAMS TABLE
-- ============================================================================

-- Add new columns to workstreams for play execution
ALTER TABLE public.workstreams
  ADD COLUMN IF NOT EXISTS play_id UUID REFERENCES public.playbook_plays(id),
  ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES public.playbooks(id),
  ADD COLUMN IF NOT EXISTS current_node_ids UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_workstreams_play_id ON public.workstreams(play_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_playbook_id ON public.workstreams(playbook_id);

-- ============================================================================
-- STEP 6: SEED 26 BRICKS (6 CATEGORIES)
-- ============================================================================

-- DATA CATEGORY (7 bricks)
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema) VALUES
('collect_data', 'Collect Data', 'Collect input from user or system', 'data',
  '{"fields": [{"name": "field_name", "type": "string", "required": true}, {"name": "input_type", "type": "string", "options": ["text", "number", "date", "select", "file", "textarea"]}, {"name": "required", "type": "boolean"}, {"name": "validation_rules", "type": "object"}, {"name": "options", "type": "array"}]}',
  '{"fields": [{"name": "collected_value", "type": "any"}, {"name": "collected_at", "type": "timestamp"}]}'
),
('validate_data', 'Validate Data', 'Validate data against rules', 'data',
  '{"fields": [{"name": "field", "type": "string", "required": true}, {"name": "validation_type", "type": "string", "required": true}, {"name": "validation_rules", "type": "object"}, {"name": "error_message", "type": "string"}]}',
  '{"fields": [{"name": "is_valid", "type": "boolean"}, {"name": "validation_errors", "type": "array"}, {"name": "validated_at", "type": "timestamp"}]}'
),
('calculate_value', 'Calculate Value', 'Compute derived values from inputs', 'data',
  '{"fields": [{"name": "formula", "type": "string", "required": true}, {"name": "input_fields", "type": "array", "required": true}, {"name": "output_field", "type": "string", "required": true}]}',
  '{"fields": [{"name": "calculated_value", "type": "number"}, {"name": "calculated_at", "type": "timestamp"}]}'
),
('store_data', 'Store Data', 'Persist data to storage', 'data',
  '{"fields": [{"name": "field", "type": "string", "required": true}, {"name": "value", "type": "any", "required": true}, {"name": "location", "type": "string", "required": true}]}',
  '{"fields": [{"name": "storage_status", "type": "boolean"}, {"name": "storage_location", "type": "string"}, {"name": "stored_at", "type": "timestamp"}]}'
),
('retrieve_data', 'Retrieve Data', 'Fetch data from storage or external source', 'data',
  '{"fields": [{"name": "source", "type": "string", "required": true}, {"name": "field", "type": "string", "required": true}, {"name": "fallback_value", "type": "any"}]}',
  '{"fields": [{"name": "retrieved_value", "type": "any"}, {"name": "source_location", "type": "string"}, {"name": "retrieved_at", "type": "timestamp"}]}'
),
('transform_data', 'Transform Data', 'Convert data format or structure', 'data',
  '{"fields": [{"name": "input_field", "type": "string", "required": true}, {"name": "transformation_type", "type": "string", "required": true}, {"name": "output_field", "type": "string", "required": true}, {"name": "config", "type": "object"}]}',
  '{"fields": [{"name": "transformed_value", "type": "any"}, {"name": "transformed_at", "type": "timestamp"}]}'
),
('delete_data', 'Delete Data', 'Remove data from storage', 'data',
  '{"fields": [{"name": "field", "type": "string", "required": true}, {"name": "location", "type": "string", "required": true}, {"name": "require_confirmation", "type": "boolean"}]}',
  '{"fields": [{"name": "deletion_status", "type": "boolean"}, {"name": "deleted_at", "type": "timestamp"}]}'
);

-- APPROVAL CATEGORY (4 bricks)
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema) VALUES
('require_approval', 'Require Approval', 'Request approval from user or role', 'approval',
  '{"fields": [{"name": "approver_role", "type": "string", "required": true}, {"name": "decision_options", "type": "array"}, {"name": "sla_hours", "type": "number"}, {"name": "escalation_rules", "type": "object"}, {"name": "approval_context", "type": "object"}]}',
  '{"fields": [{"name": "decision", "type": "string"}, {"name": "reasoning", "type": "string"}, {"name": "decided_by", "type": "uuid"}, {"name": "decided_at", "type": "timestamp"}]}'
),
('auto_approve', 'Auto Approve', 'Automatically approve if conditions are met', 'approval',
  '{"fields": [{"name": "conditions", "type": "array", "required": true}, {"name": "condition_logic", "type": "string", "options": ["AND", "OR"]}, {"name": "fallback_to_manual", "type": "boolean"}, {"name": "fallback_approver_role", "type": "string"}]}',
  '{"fields": [{"name": "auto_approved", "type": "boolean"}, {"name": "conditions_met", "type": "array"}, {"name": "fallback_triggered", "type": "boolean"}, {"name": "approved_at", "type": "timestamp"}]}'
),
('escalate_approval', 'Escalate Approval', 'Route approval to higher authority', 'approval',
  '{"fields": [{"name": "escalate_to_role", "type": "string", "required": true}, {"name": "escalation_reason", "type": "string", "required": true}, {"name": "urgency", "type": "string", "options": ["low", "medium", "high", "critical"]}]}',
  '{"fields": [{"name": "escalation_status", "type": "boolean"}, {"name": "escalated_to", "type": "uuid"}, {"name": "escalated_at", "type": "timestamp"}]}'
),
('delegate_approval', 'Delegate Approval', 'Delegate approval to another person', 'approval',
  '{"fields": [{"name": "delegate_to", "type": "uuid", "required": true}, {"name": "delegation_reason", "type": "string"}, {"name": "retain_visibility", "type": "boolean"}]}',
  '{"fields": [{"name": "delegation_status", "type": "boolean"}, {"name": "delegated_to", "type": "uuid"}, {"name": "delegated_at", "type": "timestamp"}]}'
);

-- DOCUMENT CATEGORY (6 bricks)
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema) VALUES
('generate_document', 'Generate Document', 'Create document from template', 'document',
  '{"fields": [{"name": "template_id", "type": "uuid", "required": true}, {"name": "data_mapping", "type": "object", "required": true}, {"name": "output_format", "type": "string", "options": ["docx", "pdf", "html"]}, {"name": "output_name", "type": "string"}]}',
  '{"fields": [{"name": "document_id", "type": "uuid"}, {"name": "document_url", "type": "string"}, {"name": "generated_at", "type": "timestamp"}]}'
),
('collect_document', 'Collect Document', 'Request document upload from user', 'document',
  '{"fields": [{"name": "document_type", "type": "string", "required": true}, {"name": "required", "type": "boolean"}, {"name": "accepted_formats", "type": "array"}, {"name": "max_size_mb", "type": "number"}]}',
  '{"fields": [{"name": "document_id", "type": "uuid"}, {"name": "document_metadata", "type": "object"}, {"name": "uploaded_at", "type": "timestamp"}]}'
),
('validate_document', 'Validate Document', 'Validate document format and content', 'document',
  '{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "validation_criteria", "type": "object", "required": true}, {"name": "required_fields", "type": "array"}]}',
  '{"fields": [{"name": "is_valid", "type": "boolean"}, {"name": "validation_details", "type": "object"}, {"name": "validated_at", "type": "timestamp"}]}'
),
('store_document', 'Store Document', 'Save document to repository', 'document',
  '{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "repository", "type": "string", "required": true}, {"name": "folder", "type": "string"}, {"name": "access_permissions", "type": "object"}]}',
  '{"fields": [{"name": "storage_location", "type": "string"}, {"name": "storage_status", "type": "boolean"}, {"name": "stored_at", "type": "timestamp"}]}'
),
('send_document', 'Send Document', 'Send document to recipients', 'document',
  '{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "recipients", "type": "array", "required": true}, {"name": "delivery_method", "type": "string", "options": ["email", "portal", "api"]}, {"name": "message", "type": "string"}]}',
  '{"fields": [{"name": "delivery_status", "type": "boolean"}, {"name": "delivery_id", "type": "string"}, {"name": "sent_at", "type": "timestamp"}]}'
),
('collect_signature', 'Collect Signature', 'Request electronic signature', 'document',
  '{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "signers", "type": "array", "required": true}, {"name": "signature_order", "type": "string", "options": ["parallel", "sequential"]}, {"name": "due_date", "type": "timestamp"}]}',
  '{"fields": [{"name": "signature_request_id", "type": "string"}, {"name": "all_signed", "type": "boolean"}, {"name": "signatures", "type": "array"}, {"name": "completed_at", "type": "timestamp"}]}'
);

-- WORKFLOW CATEGORY (5 bricks)
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema) VALUES
('handoff_workstream', 'Handoff Workstream', 'Transfer or spawn workstream', 'workflow',
  '{"fields": [{"name": "handoff_type", "type": "string", "required": true, "options": ["spawn", "transfer", "parallel", "merge"]}, {"name": "target_workstream_type", "type": "string"}, {"name": "handoff_data", "type": "object"}, {"name": "wait_for_completion", "type": "boolean"}]}',
  '{"fields": [{"name": "handoff_id", "type": "uuid"}, {"name": "target_workstream_id", "type": "uuid"}, {"name": "handoff_status", "type": "string"}, {"name": "initiated_at", "type": "timestamp"}]}'
),
('wait_for_event', 'Wait for Event', 'Pause until external event occurs', 'workflow',
  '{"fields": [{"name": "event_type", "type": "string", "required": true}, {"name": "event_source", "type": "string"}, {"name": "timeout_hours", "type": "number"}, {"name": "timeout_action", "type": "string"}]}',
  '{"fields": [{"name": "event_received", "type": "boolean"}, {"name": "event_data", "type": "object"}, {"name": "received_at", "type": "timestamp"}]}'
),
('wait_for_duration', 'Wait for Duration', 'Pause for specified time period', 'workflow',
  '{"fields": [{"name": "duration_minutes", "type": "number"}, {"name": "duration_until", "type": "timestamp"}, {"name": "reason", "type": "string"}]}',
  '{"fields": [{"name": "waited", "type": "boolean"}, {"name": "resume_at", "type": "timestamp"}, {"name": "actual_duration_minutes", "type": "number"}]}'
),
('send_notification', 'Send Notification', 'Send notification to users', 'workflow',
  '{"fields": [{"name": "recipient", "type": "string", "required": true}, {"name": "message", "type": "string", "required": true}, {"name": "channel", "type": "string", "options": ["in_app", "email", "sms"]}, {"name": "urgency", "type": "string", "options": ["low", "medium", "high"]}]}',
  '{"fields": [{"name": "notification_id", "type": "string"}, {"name": "notification_sent", "type": "boolean"}, {"name": "delivered_at", "type": "timestamp"}]}'
),
('schedule_task', 'Schedule Task', 'Create scheduled task or reminder', 'workflow',
  '{"fields": [{"name": "assignee", "type": "uuid", "required": true}, {"name": "due_date", "type": "timestamp", "required": true}, {"name": "description", "type": "string", "required": true}, {"name": "priority", "type": "string", "options": ["low", "medium", "high"]}, {"name": "reminders", "type": "array"}]}',
  '{"fields": [{"name": "task_id", "type": "string"}, {"name": "scheduled_at", "type": "timestamp"}, {"name": "reminders_set", "type": "array"}]}'
);

-- COMMUNICATION CATEGORY (3 bricks)
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema) VALUES
('request_meeting', 'Request Meeting', 'Schedule meeting with participants', 'communication',
  '{"fields": [{"name": "attendees", "type": "array", "required": true}, {"name": "subject", "type": "string", "required": true}, {"name": "duration_minutes", "type": "number"}, {"name": "preferred_times", "type": "array"}, {"name": "meeting_type", "type": "string", "options": ["virtual", "in_person"]}]}',
  '{"fields": [{"name": "meeting_request_id", "type": "string"}, {"name": "meeting_scheduled", "type": "boolean"}, {"name": "scheduled_time", "type": "timestamp"}, {"name": "meeting_link", "type": "string"}]}'
),
('record_decision', 'Record Decision', 'Document decision with rationale', 'communication',
  '{"fields": [{"name": "decision_type", "type": "string", "required": true}, {"name": "decision_value", "type": "any", "required": true}, {"name": "rationale", "type": "string"}, {"name": "evidence", "type": "array"}]}',
  '{"fields": [{"name": "decision_recorded", "type": "boolean"}, {"name": "decision_id", "type": "string"}, {"name": "recorded_at", "type": "timestamp"}, {"name": "recorded_by", "type": "uuid"}]}'
),
('assign_ownership', 'Assign Ownership', 'Assign ownership or responsibility', 'communication',
  '{"fields": [{"name": "assignee", "type": "uuid", "required": true}, {"name": "scope", "type": "string", "required": true}, {"name": "authority_level", "type": "string", "options": ["viewer", "contributor", "approver", "owner"]}, {"name": "duration", "type": "object"}]}',
  '{"fields": [{"name": "assignment_id", "type": "string"}, {"name": "assigned_at", "type": "timestamp"}, {"name": "assigned_by", "type": "uuid"}]}'
);

-- QUALITY CATEGORY (1 brick)
INSERT INTO public.bricks (name, display_name, purpose, brick_category, input_schema, output_schema) VALUES
('require_peer_review', 'Require Peer Review', 'Request peer review of work', 'quality',
  '{"fields": [{"name": "reviewer_role", "type": "string"}, {"name": "reviewer_id", "type": "uuid"}, {"name": "review_type", "type": "string", "options": ["approval", "feedback", "checklist"]}, {"name": "review_criteria", "type": "object"}, {"name": "sla_hours", "type": "number"}]}',
  '{"fields": [{"name": "review_status", "type": "string"}, {"name": "reviewer_feedback", "type": "string"}, {"name": "review_checklist", "type": "object"}, {"name": "reviewed_by", "type": "uuid"}, {"name": "reviewed_at", "type": "timestamp"}]}'
);

-- ============================================================================
-- STEP 7: SEED SYSTEM LIBRARY
-- ============================================================================

INSERT INTO public.libraries (name, display_name, description, library_type, is_active)
VALUES ('system', 'System Library', 'Default system library with core templates and artifacts', 'system', true);

-- ============================================================================
-- STEP 8: CREATE UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
           WHERE column_name = 'updated_at'
           AND table_schema = 'public'
           AND table_name IN ('libraries', 'library_artifacts', 'library_templates', 'library_packages',
                              'playbooks', 'bricks', 'playbook_patterns', 'playbook_plays',
                              'node_execution_state')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
