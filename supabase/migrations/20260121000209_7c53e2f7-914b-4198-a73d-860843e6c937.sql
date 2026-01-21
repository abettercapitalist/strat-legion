-- ============================================================================
-- BRICK ARCHITECTURE FOUNDATION
-- ============================================================================

-- ============================================================================
-- TABLE 1: brick_categories
-- ============================================================================
CREATE TABLE public.brick_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brick_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories (system reference data)
CREATE POLICY "Anyone can view brick_categories"
  ON public.brick_categories FOR SELECT
  USING (true);

-- ============================================================================
-- TABLE 2: bricks
-- ============================================================================
CREATE TABLE public.bricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.brick_categories(id),
  brick_number INTEGER NOT NULL UNIQUE,
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  dependency_level TEXT NOT NULL CHECK (dependency_level IN ('none', 'light', 'moderate', 'complex')),
  is_container BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for category lookups
CREATE INDEX idx_bricks_category_id ON public.bricks(category_id);
CREATE INDEX idx_bricks_dependency_level ON public.bricks(dependency_level);

-- Enable RLS
ALTER TABLE public.bricks ENABLE ROW LEVEL SECURITY;

-- Everyone can read bricks (system reference data)
CREATE POLICY "Anyone can view bricks"
  ON public.bricks FOR SELECT
  USING (true);

-- ============================================================================
-- TABLE 3: step_definitions
-- ============================================================================
CREATE TABLE public.step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  legacy_step_type TEXT,
  created_by UUID,
  workstream_type_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT step_definitions_template_or_workstream CHECK (
    (is_template = true AND workstream_type_id IS NULL) OR
    (is_template = false)
  )
);

-- Indexes
CREATE INDEX idx_step_definitions_workstream_type ON public.step_definitions(workstream_type_id);
CREATE INDEX idx_step_definitions_is_template ON public.step_definitions(is_template) WHERE is_template = true;
CREATE INDEX idx_step_definitions_legacy_type ON public.step_definitions(legacy_step_type) WHERE legacy_step_type IS NOT NULL;

-- Enable RLS
ALTER TABLE public.step_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone can view step definitions
CREATE POLICY "Anyone can view step_definitions"
  ON public.step_definitions FOR SELECT
  USING (true);

-- Authenticated users can create step definitions
CREATE POLICY "Authenticated users can create step_definitions"
  ON public.step_definitions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own step definitions (or system users for system definitions)
CREATE POLICY "Users can update own step_definitions"
  ON public.step_definitions FOR UPDATE
  USING (created_by = auth.uid() OR is_system = false);

-- Users can delete their own step definitions
CREATE POLICY "Users can delete own step_definitions"
  ON public.step_definitions FOR DELETE
  USING (created_by = auth.uid() AND is_system = false);

-- ============================================================================
-- TABLE 4: step_definition_bricks
-- ============================================================================
CREATE TABLE public.step_definition_bricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_definition_id UUID NOT NULL REFERENCES public.step_definitions(id) ON DELETE CASCADE,
  brick_id UUID NOT NULL REFERENCES public.bricks(id),
  position INTEGER NOT NULL,
  input_config JSONB NOT NULL DEFAULT '{}',
  output_mapping JSONB DEFAULT '{}',
  execution_condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_definition_id, position)
);

-- Indexes
CREATE INDEX idx_step_definition_bricks_step ON public.step_definition_bricks(step_definition_id);
CREATE INDEX idx_step_definition_bricks_brick ON public.step_definition_bricks(brick_id);

-- Enable RLS
ALTER TABLE public.step_definition_bricks ENABLE ROW LEVEL SECURITY;

-- Everyone can view step definition bricks
CREATE POLICY "Anyone can view step_definition_bricks"
  ON public.step_definition_bricks FOR SELECT
  USING (true);

-- Authenticated users can manage step definition bricks
CREATE POLICY "Authenticated users can manage step_definition_bricks"
  ON public.step_definition_bricks FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SEED DATA: brick_categories (18 categories)
-- ============================================================================
INSERT INTO public.brick_categories (name, display_name, description, display_order, icon) VALUES
  ('data', 'Data Operations', 'Collect, validate, transform, and manage data', 1, '📊'),
  ('approval', 'Approval Operations', 'Request, automate, escalate, and delegate approvals', 2, '✅'),
  ('document', 'Document Operations', 'Generate, collect, validate, store, and send documents', 3, '📄'),
  ('workflow', 'Workflow Operations', 'Control workflow execution and coordination', 4, '🔄'),
  ('logic', 'Logic Operations', 'Conditional branching, loops, and parallel execution', 5, '🔀'),
  ('measurement', 'Measurement Operations', 'Track time, count events, and log activities', 6, '📏'),
  ('intelligence', 'Pattern Recognition & Prediction', 'Analyze patterns, predict outcomes, detect anomalies', 7, '🧠'),
  ('value', 'Value & Impact Intelligence', 'Calculate business impact and track value', 8, '💰'),
  ('historical', 'Historical Comparison & Learning', 'Compare to past instances and extract lessons', 9, '📚'),
  ('conflict', 'Conflict & Consistency Detection', 'Detect conflicts and verify consistency', 10, '⚠️'),
  ('recommendation', 'Proactive Recommendations', 'Suggest actions, templates, and terms', 11, '💡'),
  ('version', 'Version Control & Change Tracking', 'Capture versions and track changes', 12, '📝'),
  ('coordination', 'Communication & Coordination', 'Schedule meetings, record decisions, assign ownership', 13, '🤝'),
  ('exception', 'Exception & Error Handling', 'Retry, handle exceptions, and timeout operations', 14, '🛡️'),
  ('access', 'Access Control & Privacy', 'Restrict access, redact data, require authentication', 15, '🔒'),
  ('bulk', 'Bulk & Batch Operations', 'Process batches and aggregate across workstreams', 16, '📦'),
  ('time', 'Time-Based Intelligence', 'Schedule checks and detect deadline risks', 17, '⏰'),
  ('quality', 'Quality Assurance', 'Run quality checks and require peer review', 18, '🎯');

-- ============================================================================
-- HELPER FUNCTION: Get category ID by name
-- ============================================================================
CREATE OR REPLACE FUNCTION get_brick_category_id(category_name TEXT) RETURNS UUID AS $$
  SELECT id FROM public.brick_categories WHERE name = category_name;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- SEED DATA: bricks (76 bricks)
-- ============================================================================

-- CATEGORY 1: DATA OPERATIONS (Bricks 1-7)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('collect_data', 'Collect Data', 'Get input from user or system', get_brick_category_id('data'), 1,
'{"fields": [{"name": "field_name", "type": "string", "required": true}, {"name": "input_type", "type": "enum", "options": ["text", "number", "date", "select", "file", "textarea"]}, {"name": "validation_rules", "type": "object"}, {"name": "required", "type": "boolean", "default": false}]}'::jsonb,
'{"fields": [{"name": "collected_value", "type": "any"}, {"name": "validation_status", "type": "boolean"}]}'::jsonb,
'{}', 'none', false),

('validate_data', 'Validate Data', 'Check data meets criteria', get_brick_category_id('data'), 2,
'{"fields": [{"name": "field", "type": "string", "required": true}, {"name": "validation_type", "type": "enum", "options": ["format", "range", "required", "custom"]}, {"name": "validation_rules", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "is_valid", "type": "boolean"}, {"name": "validation_errors", "type": "array"}]}'::jsonb,
'{}', 'none', false),

('calculate_value', 'Calculate Value', 'Compute derived values', get_brick_category_id('data'), 3,
'{"fields": [{"name": "formula", "type": "string", "required": true}, {"name": "input_fields", "type": "array"}, {"name": "output_field", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "calculated_value", "type": "number"}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false),

('store_data', 'Store Data', 'Persist data to specific location', get_brick_category_id('data'), 4,
'{"fields": [{"name": "field", "type": "string", "required": true}, {"name": "value", "type": "any"}, {"name": "location", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "storage_status", "type": "boolean"}]}'::jsonb,
'{}', 'none', false),

('retrieve_data', 'Retrieve Data', 'Fetch data from storage or external source', get_brick_category_id('data'), 5,
'{"fields": [{"name": "source", "type": "string", "required": true}, {"name": "field", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "retrieved_value", "type": "any"}]}'::jsonb,
'{}', 'none', false),

('transform_data', 'Transform Data', 'Convert data format or structure', get_brick_category_id('data'), 6,
'{"fields": [{"name": "input_field", "type": "string"}, {"name": "transformation_type", "type": "enum", "options": ["uppercase", "lowercase", "format_date", "parse_json"]}]}'::jsonb,
'{"fields": [{"name": "transformed_value", "type": "any"}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false),

('delete_data', 'Delete Data', 'Remove data from storage', get_brick_category_id('data'), 7,
'{"fields": [{"name": "field", "type": "string", "required": true}, {"name": "location", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "deletion_status", "type": "boolean"}]}'::jsonb,
'{}', 'none', false);

-- CATEGORY 2: APPROVAL OPERATIONS (Bricks 8-11)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('require_approval', 'Require Approval', 'Need decision from role or user', get_brick_category_id('approval'), 8,
'{"fields": [{"name": "approver_role", "type": "string", "required": true}, {"name": "decision_options", "type": "array", "default": ["approve", "reject", "request_more_info"]}, {"name": "sla_hours", "type": "number"}]}'::jsonb,
'{"fields": [{"name": "decision", "type": "string"}, {"name": "reasoning", "type": "string"}, {"name": "decided_by", "type": "uuid"}]}'::jsonb,
'{}', 'none', false),

('auto_approve', 'Auto-Approve', 'Approve automatically if conditions met', get_brick_category_id('approval'), 9,
'{"fields": [{"name": "conditions", "type": "object", "required": true}, {"name": "condition_logic", "type": "enum", "options": ["AND", "OR"], "default": "AND"}]}'::jsonb,
'{"fields": [{"name": "auto_approved", "type": "boolean"}, {"name": "conditions_met", "type": "array"}]}'::jsonb,
'{}', 'light', false),

('escalate_approval', 'Escalate Approval', 'Move approval to higher authority', get_brick_category_id('approval'), 10,
'{"fields": [{"name": "escalation_role", "type": "string", "required": true}, {"name": "reason", "type": "string"}, {"name": "preserve_context", "type": "boolean", "default": true}]}'::jsonb,
'{"fields": [{"name": "escalated_to", "type": "uuid"}, {"name": "new_sla_hours", "type": "number"}]}'::jsonb,
ARRAY['require_approval'], 'light', false),

('delegate_approval', 'Delegate Approval', 'Assign approval to another user', get_brick_category_id('approval'), 11,
'{"fields": [{"name": "delegate_to", "type": "uuid", "required": true}, {"name": "reason", "type": "string"}, {"name": "retain_oversight", "type": "boolean", "default": true}]}'::jsonb,
'{"fields": [{"name": "delegated_to", "type": "uuid"}, {"name": "delegation_id", "type": "uuid"}]}'::jsonb,
ARRAY['require_approval'], 'light', false);

-- CATEGORY 3: DOCUMENT OPERATIONS (Bricks 12-20)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('generate_document', 'Generate Document', 'Create document from template', get_brick_category_id('document'), 12,
'{"fields": [{"name": "template_id", "type": "uuid", "required": true}, {"name": "data_mapping", "type": "object"}, {"name": "output_format", "type": "enum", "options": ["docx", "pdf"]}]}'::jsonb,
'{"fields": [{"name": "document_id", "type": "uuid"}, {"name": "document_url", "type": "string"}]}'::jsonb,
'{}', 'light', false),

('collect_document', 'Collect Document', 'Request document upload from user', get_brick_category_id('document'), 13,
'{"fields": [{"name": "document_type", "type": "string", "required": true}, {"name": "required_format", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "document_id", "type": "uuid"}, {"name": "upload_status", "type": "boolean"}]}'::jsonb,
'{}', 'none', false),

('validate_document', 'Validate Document', 'Check document meets requirements', get_brick_category_id('document'), 14,
'{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "validation_rules", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "is_valid", "type": "boolean"}, {"name": "validation_results", "type": "array"}]}'::jsonb,
ARRAY['collect_document'], 'light', false),

('store_document', 'Store Document', 'Save document to repository', get_brick_category_id('document'), 15,
'{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "repository", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "storage_location", "type": "string"}, {"name": "stored_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('retrieve_document', 'Retrieve Document', 'Fetch document from storage', get_brick_category_id('document'), 16,
'{"fields": [{"name": "document_id", "type": "uuid"}, {"name": "version", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "document_url", "type": "string"}, {"name": "metadata", "type": "object"}]}'::jsonb,
'{}', 'none', false),

('send_document', 'Send Document', 'Transmit document to recipient', get_brick_category_id('document'), 17,
'{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "recipient", "type": "string"}, {"name": "delivery_method", "type": "enum", "options": ["email", "portal", "api"]}]}'::jsonb,
'{"fields": [{"name": "sent_status", "type": "boolean"}, {"name": "tracking_id", "type": "string"}]}'::jsonb,
ARRAY['retrieve_document'], 'light', false),

('sign_document', 'Sign Document', 'Request e-signature on document', get_brick_category_id('document'), 18,
'{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "signers", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "envelope_id", "type": "string"}, {"name": "signature_status", "type": "string"}]}'::jsonb,
ARRAY['retrieve_document'], 'moderate', false),

('extract_data_from_document', 'Extract Data from Document', 'Parse and extract structured data', get_brick_category_id('document'), 19,
'{"fields": [{"name": "document_id", "type": "uuid", "required": true}, {"name": "extraction_template", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "extracted_data", "type": "object"}, {"name": "confidence_scores", "type": "object"}]}'::jsonb,
ARRAY['retrieve_document'], 'moderate', false),

('merge_documents', 'Merge Documents', 'Combine multiple documents into one', get_brick_category_id('document'), 20,
'{"fields": [{"name": "document_ids", "type": "array", "required": true}, {"name": "merge_order", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "merged_document_id", "type": "uuid"}]}'::jsonb,
ARRAY['retrieve_document'], 'light', false);

-- CATEGORY 4: WORKFLOW OPERATIONS (Bricks 21-25)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('send_notification', 'Send Notification', 'Alert user or role about something', get_brick_category_id('workflow'), 21,
'{"fields": [{"name": "recipient", "type": "string", "required": true}, {"name": "message", "type": "string"}, {"name": "channel", "type": "enum", "options": ["in_app", "email", "slack"]}]}'::jsonb,
'{"fields": [{"name": "notification_sent", "type": "boolean"}, {"name": "delivered_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('schedule_task', 'Schedule Task', 'Create calendar event or reminder', get_brick_category_id('workflow'), 22,
'{"fields": [{"name": "assignee", "type": "string", "required": true}, {"name": "due_date", "type": "timestamp"}, {"name": "description", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "task_id", "type": "uuid"}, {"name": "scheduled_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('wait_for_condition', 'Wait for Condition', 'Pause until condition is met', get_brick_category_id('workflow'), 23,
'{"fields": [{"name": "condition", "type": "object", "required": true}, {"name": "timeout_hours", "type": "number"}, {"name": "check_interval_minutes", "type": "number", "default": 60}]}'::jsonb,
'{"fields": [{"name": "condition_met", "type": "boolean"}, {"name": "wait_duration_hours", "type": "number"}]}'::jsonb,
'{}', 'none', true),

('trigger_workflow', 'Trigger Workflow', 'Start another workflow', get_brick_category_id('workflow'), 24,
'{"fields": [{"name": "workflow_id", "type": "uuid", "required": true}, {"name": "input_data", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "triggered_workflow_id", "type": "uuid"}, {"name": "triggered_at", "type": "timestamp"}]}'::jsonb,
'{}', 'moderate', false),

('complete_step', 'Complete Step', 'Mark step as done', get_brick_category_id('workflow'), 25,
'{"fields": [{"name": "step_id", "type": "string", "required": true}, {"name": "completion_data", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "completed", "type": "boolean"}, {"name": "completed_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false);

-- CATEGORY 5: LOGIC OPERATIONS (Bricks 26-28)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('branch_conditional', 'Branch Conditional', 'Choose path based on condition', get_brick_category_id('logic'), 26,
'{"fields": [{"name": "condition", "type": "object", "required": true}, {"name": "true_branch", "type": "array"}, {"name": "false_branch", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "branch_taken", "type": "string"}, {"name": "evaluation_result", "type": "boolean"}]}'::jsonb,
'{}', 'light', true),

('loop_until', 'Loop Until', 'Repeat until condition met', get_brick_category_id('logic'), 27,
'{"fields": [{"name": "exit_condition", "type": "object", "required": true}, {"name": "max_iterations", "type": "number", "default": 10}, {"name": "loop_body", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "iterations_completed", "type": "number"}, {"name": "exit_reason", "type": "string"}]}'::jsonb,
'{}', 'moderate', true),

('run_parallel', 'Run Parallel', 'Execute multiple operations simultaneously', get_brick_category_id('logic'), 28,
'{"fields": [{"name": "parallel_operations", "type": "array", "required": true}, {"name": "wait_for_all", "type": "boolean", "default": true}]}'::jsonb,
'{"fields": [{"name": "results", "type": "array"}, {"name": "all_completed", "type": "boolean"}]}'::jsonb,
'{}', 'complex', true);

-- CATEGORY 6: MEASUREMENT OPERATIONS (Bricks 29-30)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('timestamp_event', 'Timestamp Event', 'Record when something happened', get_brick_category_id('measurement'), 29,
'{"fields": [{"name": "event_name", "type": "string", "required": true}, {"name": "event_data", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "event_id", "type": "uuid"}, {"name": "recorded_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('measure_value', 'Measure Value', 'Capture numeric metric', get_brick_category_id('measurement'), 30,
'{"fields": [{"name": "metric_name", "type": "string", "required": true}, {"name": "value", "type": "number"}]}'::jsonb,
'{"fields": [{"name": "measurement_id", "type": "uuid"}, {"name": "measured_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('log_activity', 'Log Activity', 'Record activity for audit trail', get_brick_category_id('measurement'), 76,
'{"fields": [{"name": "activity_type", "type": "string", "required": true}, {"name": "description", "type": "string"}, {"name": "metadata", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "log_entry_id", "type": "uuid"}, {"name": "logged_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false);

-- CATEGORY 7: INTELLIGENCE (Bricks 31-38)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('compare_to_baseline', 'Compare to Baseline', 'Compare workstream against historical similar ones', get_brick_category_id('intelligence'), 31,
'{"fields": [{"name": "comparison_criteria", "type": "object"}, {"name": "time_period_days", "type": "number", "default": 90}]}'::jsonb,
'{"fields": [{"name": "variance_report", "type": "object"}, {"name": "is_normal", "type": "boolean"}]}'::jsonb,
ARRAY['retrieve_data', 'measure_value'], 'light', false),

('detect_anomaly', 'Detect Anomaly', 'Flag when something deviates from pattern', get_brick_category_id('intelligence'), 32,
'{"fields": [{"name": "metric_to_track", "type": "string", "required": true}, {"name": "sensitivity", "type": "enum", "options": ["low", "medium", "high"]}]}'::jsonb,
'{"fields": [{"name": "is_anomalous", "type": "boolean"}, {"name": "confidence_score", "type": "number"}]}'::jsonb,
ARRAY['compare_to_baseline', 'measure_value'], 'moderate', false),

('predict_completion', 'Predict Completion', 'Estimate when this will finish based on patterns', get_brick_category_id('intelligence'), 33,
'{"fields": [{"name": "historical_data_source", "type": "string"}, {"name": "confidence_level", "type": "number", "default": 0.8}]}'::jsonb,
'{"fields": [{"name": "predicted_date", "type": "timestamp"}, {"name": "confidence_range", "type": "object"}]}'::jsonb,
ARRAY['compare_to_baseline', 'retrieve_data'], 'light', false),

('identify_bottleneck', 'Identify Bottleneck', 'Show what is causing delays', get_brick_category_id('intelligence'), 34,
'{"fields": [{"name": "scope", "type": "enum", "options": ["workstream", "team", "company"]}, {"name": "time_window_days", "type": "number", "default": 30}]}'::jsonb,
'{"fields": [{"name": "bottleneck_location", "type": "string"}, {"name": "impact_score", "type": "number"}]}'::jsonb,
ARRAY['measure_value', 'compare_to_baseline'], 'moderate', false),

('surface_pattern', 'Surface Pattern', 'Identify repeated issues automatically', get_brick_category_id('intelligence'), 35,
'{"fields": [{"name": "pattern_type", "type": "string"}, {"name": "frequency_threshold", "type": "number", "default": 3}]}'::jsonb,
'{"fields": [{"name": "pattern_description", "type": "string"}, {"name": "occurrence_count", "type": "number"}]}'::jsonb,
ARRAY['retrieve_data', 'compare_to_baseline'], 'light', false),

('calculate_health_score', 'Calculate Health Score', 'Overall workstream health metric', get_brick_category_id('intelligence'), 36,
'{"fields": [{"name": "health_factors", "type": "array"}, {"name": "weights", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "health_score", "type": "number"}, {"name": "trend", "type": "enum", "options": ["improving", "stable", "declining"]}]}'::jsonb,
ARRAY['measure_value', 'compare_to_baseline'], 'moderate', false),

('track_velocity', 'Track Velocity', 'Measure how fast work is moving', get_brick_category_id('intelligence'), 37,
'{"fields": [{"name": "measurement_window_days", "type": "number", "default": 30}]}'::jsonb,
'{"fields": [{"name": "current_velocity", "type": "number"}, {"name": "trend", "type": "enum", "options": ["accelerating", "stable", "decelerating"]}]}'::jsonb,
ARRAY['measure_value', 'timestamp_event'], 'moderate', false),

('flag_risk', 'Flag Risk', 'Identify risk factors based on data patterns', get_brick_category_id('intelligence'), 38,
'{"fields": [{"name": "risk_indicators", "type": "array"}, {"name": "severity_threshold", "type": "enum", "options": ["low", "medium", "high"]}]}'::jsonb,
'{"fields": [{"name": "risk_level", "type": "enum", "options": ["low", "medium", "high", "critical"]}, {"name": "risk_factors", "type": "array"}]}'::jsonb,
ARRAY['detect_anomaly', 'compare_to_baseline'], 'moderate', false);

-- CATEGORY 8: VALUE & IMPACT (Bricks 39-42)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('calculate_business_impact', 'Calculate Business Impact', 'Measure actual business value/cost', get_brick_category_id('value'), 39,
'{"fields": [{"name": "value_factors", "type": "array"}, {"name": "cost_factors", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "total_value", "type": "number"}, {"name": "roi", "type": "number"}]}'::jsonb,
ARRAY['retrieve_data', 'calculate_value'], 'light', false),

('track_opportunity_cost', 'Track Opportunity Cost', 'Calculate what delays are costing', get_brick_category_id('value'), 40,
'{"fields": [{"name": "value_per_day", "type": "number"}, {"name": "delay_threshold_days", "type": "number", "default": 3}]}'::jsonb,
'{"fields": [{"name": "cost_of_delay", "type": "number"}, {"name": "urgency_score", "type": "number"}]}'::jsonb,
ARRAY['calculate_business_impact', 'track_velocity'], 'moderate', false),

('aggregate_portfolio_value', 'Aggregate Portfolio Value', 'Roll up value across multiple workstreams', get_brick_category_id('value'), 41,
'{"fields": [{"name": "portfolio_scope", "type": "object"}, {"name": "value_dimension", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "total_value", "type": "number"}, {"name": "distribution", "type": "object"}]}'::jsonb,
ARRAY['calculate_business_impact'], 'light', false),

('measure_resource_utilization', 'Measure Resource Utilization', 'Track capacity being used', get_brick_category_id('value'), 42,
'{"fields": [{"name": "resource_type", "type": "string"}, {"name": "capacity_ceiling", "type": "number"}]}'::jsonb,
'{"fields": [{"name": "utilization_rate", "type": "number"}, {"name": "headroom", "type": "number"}]}'::jsonb,
ARRAY['measure_value', 'aggregate_portfolio_value'], 'moderate', false);

-- CATEGORY 9: HISTORICAL (Bricks 43-46)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('compare_to_past_instance', 'Compare to Past Instance', 'Compare to previous similar workstream', get_brick_category_id('historical'), 43,
'{"fields": [{"name": "similarity_criteria", "type": "object"}, {"name": "comparison_points", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "similarities", "type": "object"}, {"name": "lessons_learned", "type": "array"}]}'::jsonb,
ARRAY['retrieve_data', 'compare_to_baseline'], 'light', false),

('retrieve_precedent', 'Retrieve Precedent', 'Find what we did last time', get_brick_category_id('historical'), 44,
'{"fields": [{"name": "situation_description", "type": "string"}, {"name": "recency_weight", "type": "number", "default": 0.5}]}'::jsonb,
'{"fields": [{"name": "precedent_cases", "type": "array"}, {"name": "confidence", "type": "number"}]}'::jsonb,
ARRAY['compare_to_past_instance', 'retrieve_data'], 'light', false),

('track_evolution', 'Track Evolution', 'Show how terms changed over time', get_brick_category_id('historical'), 45,
'{"fields": [{"name": "counterparty_id", "type": "uuid"}, {"name": "track_fields", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "evolution_timeline", "type": "array"}, {"name": "trend_direction", "type": "enum", "options": ["improving", "stable", "declining"]}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false),

('surface_lesson', 'Surface Lesson', 'Pull learnings from similar deals', get_brick_category_id('historical'), 46,
'{"fields": [{"name": "context_description", "type": "string"}, {"name": "lesson_type", "type": "enum", "options": ["pitfall", "success", "best_practice"]}]}'::jsonb,
'{"fields": [{"name": "lessons", "type": "array"}, {"name": "source_workstreams", "type": "array"}]}'::jsonb,
ARRAY['retrieve_precedent', 'compare_to_past_instance'], 'light', false);

-- CATEGORY 10: CONFLICT & CONSISTENCY (Bricks 47-50)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('detect_conflict', 'Detect Conflict', 'Find conflicting terms or data', get_brick_category_id('conflict'), 47,
'{"fields": [{"name": "compare_fields", "type": "array"}, {"name": "conflict_rules", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "has_conflict", "type": "boolean"}, {"name": "conflicts", "type": "array"}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false),

('verify_consistency', 'Verify Consistency', 'Check data consistency across sources', get_brick_category_id('conflict'), 48,
'{"fields": [{"name": "sources", "type": "array"}, {"name": "consistency_rules", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "is_consistent", "type": "boolean"}, {"name": "inconsistencies", "type": "array"}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false),

('resolve_conflict', 'Resolve Conflict', 'Apply conflict resolution strategy', get_brick_category_id('conflict'), 49,
'{"fields": [{"name": "conflict_id", "type": "uuid"}, {"name": "resolution_strategy", "type": "enum", "options": ["newest_wins", "manual", "merge"]}]}'::jsonb,
'{"fields": [{"name": "resolved", "type": "boolean"}, {"name": "resolution_details", "type": "object"}]}'::jsonb,
ARRAY['detect_conflict'], 'light', false),

('validate_completeness', 'Validate Completeness', 'Check all required elements present', get_brick_category_id('conflict'), 50,
'{"fields": [{"name": "required_elements", "type": "array"}, {"name": "validation_scope", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "is_complete", "type": "boolean"}, {"name": "missing_elements", "type": "array"}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false);

-- CATEGORY 11: RECOMMENDATIONS (Bricks 51-54)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('suggest_next_action', 'Suggest Next Action', 'Recommend what to do next', get_brick_category_id('recommendation'), 51,
'{"fields": [{"name": "context", "type": "object"}, {"name": "action_types", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "suggestions", "type": "array"}, {"name": "confidence_scores", "type": "object"}]}'::jsonb,
ARRAY['retrieve_data', 'calculate_health_score'], 'moderate', false),

('recommend_template', 'Recommend Template', 'Suggest best template to use', get_brick_category_id('recommendation'), 52,
'{"fields": [{"name": "workstream_context", "type": "object"}, {"name": "template_pool", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "recommended_template_id", "type": "uuid"}, {"name": "match_score", "type": "number"}]}'::jsonb,
ARRAY['retrieve_data', 'compare_to_past_instance'], 'light', false),

('suggest_terms', 'Suggest Terms', 'Recommend optimal contract terms', get_brick_category_id('recommendation'), 53,
'{"fields": [{"name": "term_category", "type": "string"}, {"name": "counterparty_context", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "suggested_terms", "type": "array"}, {"name": "rationale", "type": "string"}]}'::jsonb,
ARRAY['retrieve_precedent', 'track_evolution'], 'moderate', false),

('recommend_assignee', 'Recommend Assignee', 'Suggest best person for task', get_brick_category_id('recommendation'), 54,
'{"fields": [{"name": "task_type", "type": "string"}, {"name": "required_skills", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "recommended_users", "type": "array"}, {"name": "match_reasoning", "type": "object"}]}'::jsonb,
ARRAY['measure_resource_utilization'], 'light', false);

-- CATEGORY 12: VERSION CONTROL (Bricks 55-57)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('capture_version', 'Capture Version', 'Save point-in-time snapshot', get_brick_category_id('version'), 55,
'{"fields": [{"name": "version_label", "type": "string"}, {"name": "snapshot_scope", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "version_id", "type": "uuid"}, {"name": "captured_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('compare_versions', 'Compare Versions', 'Show differences between versions', get_brick_category_id('version'), 56,
'{"fields": [{"name": "version_a", "type": "uuid"}, {"name": "version_b", "type": "uuid"}]}'::jsonb,
'{"fields": [{"name": "differences", "type": "array"}, {"name": "change_summary", "type": "string"}]}'::jsonb,
ARRAY['capture_version'], 'light', false),

('track_change', 'Track Change', 'Record what changed and why', get_brick_category_id('version'), 57,
'{"fields": [{"name": "change_type", "type": "string"}, {"name": "changed_fields", "type": "array"}, {"name": "change_reason", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "change_id", "type": "uuid"}, {"name": "tracked_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false);

-- CATEGORY 13: COORDINATION (Bricks 58-61)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('schedule_meeting', 'Schedule Meeting', 'Book time with participants', get_brick_category_id('coordination'), 58,
'{"fields": [{"name": "participants", "type": "array"}, {"name": "duration_minutes", "type": "number"}, {"name": "topic", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "meeting_id", "type": "uuid"}, {"name": "scheduled_time", "type": "timestamp"}]}'::jsonb,
'{}', 'moderate', false),

('record_decision', 'Record Decision', 'Document decision with context', get_brick_category_id('coordination'), 59,
'{"fields": [{"name": "decision", "type": "string"}, {"name": "decision_makers", "type": "array"}, {"name": "rationale", "type": "string"}]}'::jsonb,
'{"fields": [{"name": "decision_id", "type": "uuid"}, {"name": "recorded_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false),

('request_feedback', 'Request Feedback', 'Ask for input from stakeholders', get_brick_category_id('coordination'), 60,
'{"fields": [{"name": "feedback_from", "type": "array"}, {"name": "questions", "type": "array"}, {"name": "deadline", "type": "timestamp"}]}'::jsonb,
'{"fields": [{"name": "feedback_request_id", "type": "uuid"}, {"name": "responses", "type": "array"}]}'::jsonb,
ARRAY['send_notification'], 'light', false),

('assign_ownership', 'Assign Ownership', 'Designate responsible party', get_brick_category_id('coordination'), 61,
'{"fields": [{"name": "assignee", "type": "string"}, {"name": "scope", "type": "string"}, {"name": "authority_level", "type": "enum", "options": ["viewer", "contributor", "owner"]}]}'::jsonb,
'{"fields": [{"name": "assignment_id", "type": "uuid"}, {"name": "assigned_at", "type": "timestamp"}]}'::jsonb,
'{}', 'none', false);

-- CATEGORY 14: EXCEPTION HANDLING (Bricks 62-64)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('retry_operation', 'Retry Operation', 'Attempt operation again after failure', get_brick_category_id('exception'), 62,
'{"fields": [{"name": "operation_id", "type": "uuid"}, {"name": "max_retries", "type": "number", "default": 3}, {"name": "backoff_seconds", "type": "number", "default": 60}]}'::jsonb,
'{"fields": [{"name": "retry_count", "type": "number"}, {"name": "success", "type": "boolean"}]}'::jsonb,
'{}', 'light', false),

('handle_exception', 'Handle Exception', 'Define fallback for error cases', get_brick_category_id('exception'), 63,
'{"fields": [{"name": "exception_type", "type": "string"}, {"name": "fallback_action", "type": "object"}, {"name": "notification_required", "type": "boolean", "default": true}]}'::jsonb,
'{"fields": [{"name": "handled", "type": "boolean"}, {"name": "fallback_executed", "type": "boolean"}]}'::jsonb,
'{}', 'light', true),

('timeout_operation', 'Timeout Operation', 'Set deadline for operation completion', get_brick_category_id('exception'), 64,
'{"fields": [{"name": "timeout_hours", "type": "number"}, {"name": "on_timeout_action", "type": "object"}]}'::jsonb,
'{"fields": [{"name": "timed_out", "type": "boolean"}, {"name": "elapsed_hours", "type": "number"}]}'::jsonb,
'{}', 'light', true);

-- CATEGORY 15: ACCESS CONTROL (Bricks 65-67)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('restrict_access', 'Restrict Access', 'Limit who can see or modify', get_brick_category_id('access'), 65,
'{"fields": [{"name": "resource_id", "type": "uuid"}, {"name": "allowed_roles", "type": "array"}, {"name": "restriction_type", "type": "enum", "options": ["view", "edit", "delete"]}]}'::jsonb,
'{"fields": [{"name": "restriction_applied", "type": "boolean"}, {"name": "restriction_id", "type": "uuid"}]}'::jsonb,
'{}', 'light', false),

('redact_sensitive_data', 'Redact Sensitive Data', 'Hide confidential information', get_brick_category_id('access'), 66,
'{"fields": [{"name": "fields_to_redact", "type": "array"}, {"name": "redaction_level", "type": "enum", "options": ["partial", "full"]}]}'::jsonb,
'{"fields": [{"name": "redacted_fields", "type": "array"}, {"name": "redaction_applied", "type": "boolean"}]}'::jsonb,
'{}', 'light', false),

('require_authentication', 'Require Authentication', 'Verify user identity before proceeding', get_brick_category_id('access'), 67,
'{"fields": [{"name": "auth_method", "type": "enum", "options": ["password", "mfa", "sso"]}, {"name": "session_duration_hours", "type": "number"}]}'::jsonb,
'{"fields": [{"name": "authenticated", "type": "boolean"}, {"name": "auth_method_used", "type": "string"}]}'::jsonb,
'{}', 'moderate', false);

-- CATEGORY 16: BULK OPERATIONS (Bricks 68-70)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('batch_process', 'Batch Process', 'Apply operation to multiple items', get_brick_category_id('bulk'), 68,
'{"fields": [{"name": "items", "type": "array"}, {"name": "operation", "type": "object"}, {"name": "parallel", "type": "boolean", "default": false}]}'::jsonb,
'{"fields": [{"name": "processed_count", "type": "number"}, {"name": "results", "type": "array"}]}'::jsonb,
'{}', 'moderate', true),

('aggregate_across_workstreams', 'Aggregate Across Workstreams', 'Combine data from multiple workstreams', get_brick_category_id('bulk'), 69,
'{"fields": [{"name": "workstream_filter", "type": "object"}, {"name": "aggregation_method", "type": "enum", "options": ["sum", "average", "count", "max", "min"]}]}'::jsonb,
'{"fields": [{"name": "aggregated_data", "type": "object"}, {"name": "source_count", "type": "number"}]}'::jsonb,
ARRAY['retrieve_data'], 'light', false),

('clone_workstream', 'Clone Workstream', 'Create copy of existing workstream', get_brick_category_id('bulk'), 70,
'{"fields": [{"name": "source_workstream_id", "type": "uuid"}, {"name": "copy_depth", "type": "enum", "options": ["shallow", "deep"]}]}'::jsonb,
'{"fields": [{"name": "new_workstream_id", "type": "uuid"}, {"name": "cloned_elements", "type": "array"}]}'::jsonb,
'{}', 'none', false);

-- CATEGORY 17: TIME-BASED INTELLIGENCE (Bricks 71-73)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('schedule_recurring_check', 'Schedule Recurring Check', 'Run check on regular schedule', get_brick_category_id('time'), 71,
'{"fields": [{"name": "check_operation", "type": "object"}, {"name": "frequency", "type": "enum", "options": ["hourly", "daily", "weekly", "monthly"]}]}'::jsonb,
'{"fields": [{"name": "schedule_id", "type": "uuid"}, {"name": "next_run", "type": "timestamp"}]}'::jsonb,
'{}', 'complex', true),

('detect_deadline_risk', 'Detect Deadline Risk', 'Flag approaching deadlines', get_brick_category_id('time'), 72,
'{"fields": [{"name": "deadline_field", "type": "string"}, {"name": "warning_threshold_days", "type": "number", "default": 3}]}'::jsonb,
'{"fields": [{"name": "risk_level", "type": "enum", "options": ["low", "medium", "high", "critical"]}, {"name": "days_remaining", "type": "number"}]}'::jsonb,
ARRAY['predict_completion', 'track_velocity'], 'complex', false),

('calculate_time_saved', 'Calculate Time Saved', 'Measure time saved vs manual', get_brick_category_id('time'), 73,
'{"fields": [{"name": "manual_baseline_minutes", "type": "number"}, {"name": "automated_time_minutes", "type": "number"}]}'::jsonb,
'{"fields": [{"name": "time_saved_hours", "type": "number"}, {"name": "efficiency_gain_percentage", "type": "number"}]}'::jsonb,
ARRAY['measure_value'], 'light', false);

-- CATEGORY 18: QUALITY ASSURANCE (Bricks 74-75)
INSERT INTO public.bricks (name, display_name, purpose, category_id, brick_number, input_schema, output_schema, dependencies, dependency_level, is_container) VALUES
('run_quality_check', 'Run Quality Check', 'Verify work meets standards', get_brick_category_id('quality'), 74,
'{"fields": [{"name": "quality_criteria", "type": "array"}, {"name": "acceptance_threshold", "type": "number", "default": 80}]}'::jsonb,
'{"fields": [{"name": "quality_score", "type": "number"}, {"name": "failed_checks", "type": "array"}]}'::jsonb,
ARRAY['validate_completeness', 'validate_data'], 'complex', false),

('require_peer_review', 'Require Peer Review', 'Get colleague to review', get_brick_category_id('quality'), 75,
'{"fields": [{"name": "reviewer_role", "type": "string"}, {"name": "review_criteria", "type": "array"}]}'::jsonb,
'{"fields": [{"name": "review_status", "type": "enum", "options": ["pending", "approved", "changes_requested"]}, {"name": "feedback", "type": "string"}]}'::jsonb,
ARRAY['send_notification', 'require_approval'], 'complex', false);

-- CLEANUP: Drop helper function
DROP FUNCTION IF EXISTS get_brick_category_id(TEXT);

-- ============================================================================
-- LEGACY STEP TYPE MAPPINGS
-- ============================================================================

-- INSERT LEGACY STEP DEFINITIONS (6 system step definitions)
INSERT INTO public.step_definitions (id, name, display_name, description, icon, is_template, is_system, legacy_step_type) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'legacy_generate_document', 'Generate Document', 'Create document from template and store it', '📄', true, true, 'generate_document'),
  ('a0000001-0000-0000-0000-000000000002', 'legacy_approval', 'Approval', 'Request approval from designated role with optional auto-approval', '✅', true, true, 'approval'),
  ('a0000001-0000-0000-0000-000000000003', 'legacy_send_notification', 'Send Notification', 'Send notification to user or role', '🔔', true, true, 'send_notification'),
  ('a0000001-0000-0000-0000-000000000004', 'legacy_assign_task', 'Assign Task', 'Assign task to team or role with due date', '👤', true, true, 'assign_task'),
  ('a0000001-0000-0000-0000-000000000005', 'legacy_request_information', 'Request Information', 'Request and validate information from user or team', '❓', true, true, 'request_information'),
  ('a0000001-0000-0000-0000-000000000006', 'legacy_send_reminder', 'Send Reminder', 'Send reminder notification about pending items', '⏰', true, true, 'send_reminder');

-- Helper function to get brick ID by name
CREATE OR REPLACE FUNCTION get_brick_id(brick_name TEXT) RETURNS UUID AS $$
  SELECT id FROM public.bricks WHERE name = brick_name;
$$ LANGUAGE SQL STABLE;

-- LINK STEP DEFINITIONS TO BRICKS

-- 1. generate_document → generate_document + store_document
INSERT INTO public.step_definition_bricks (step_definition_id, brick_id, position, input_config, output_mapping) VALUES
('a0000001-0000-0000-0000-000000000001', get_brick_id('generate_document'), 1,
'{"template_id": {"source": "step_config", "field": "template_id"}, "data_mapping": {"source": "step_config", "field": "data_mapping"}}'::jsonb,
'{"document_id": "generated_document_id", "document_url": "generated_document_url"}'::jsonb),
('a0000001-0000-0000-0000-000000000001', get_brick_id('store_document'), 2,
'{"document_id": {"source": "previous_output", "field": "generated_document_id"}, "repository": {"source": "step_config", "field": "repository", "default": "workstream_documents"}}'::jsonb,
'{"storage_location": "document_storage_location"}'::jsonb);

-- 2. approval → auto_approve + require_approval
INSERT INTO public.step_definition_bricks (step_definition_id, brick_id, position, input_config, output_mapping, execution_condition) VALUES
('a0000001-0000-0000-0000-000000000002', get_brick_id('auto_approve'), 1,
'{"conditions": {"source": "step_config", "field": "auto_approval_standards"}, "fallback_to_manual": true}'::jsonb,
'{"auto_approved": "was_auto_approved", "fallback_triggered": "needs_manual_approval"}'::jsonb,
'{"when": "step_config.auto_approval_standards IS NOT NULL"}'::jsonb),
('a0000001-0000-0000-0000-000000000002', get_brick_id('require_approval'), 2,
'{"approver_role": {"source": "step_config", "field": "approver_teams"}, "decision_options": ["approve", "reject", "request_more_info"]}'::jsonb,
'{"decision": "approval_decision", "decided_by": "approved_by"}'::jsonb,
'{"when": "previous_output.needs_manual_approval = true OR step_config.auto_approval_standards IS NULL"}'::jsonb);

-- 3. send_notification → send_notification
INSERT INTO public.step_definition_bricks (step_definition_id, brick_id, position, input_config, output_mapping) VALUES
('a0000001-0000-0000-0000-000000000003', get_brick_id('send_notification'), 1,
'{"recipient": {"source": "step_config", "field": "notify_team"}, "message": {"source": "step_config", "field": "message"}}'::jsonb,
'{"notification_sent": "notification_sent"}'::jsonb);

-- 4. assign_task → assign_ownership + schedule_task + send_notification
INSERT INTO public.step_definition_bricks (step_definition_id, brick_id, position, input_config, output_mapping) VALUES
('a0000001-0000-0000-0000-000000000004', get_brick_id('assign_ownership'), 1,
'{"assignee": {"source": "step_config", "field": "assign_to"}, "scope": {"source": "step_config", "field": "description"}}'::jsonb,
'{"assignment_id": "task_assignment_id"}'::jsonb),
('a0000001-0000-0000-0000-000000000004', get_brick_id('schedule_task'), 2,
'{"assignee": {"source": "step_config", "field": "assign_to"}, "due_date": {"source": "step_config", "field": "due_days", "transform": "days_from_now"}}'::jsonb,
'{"task_id": "scheduled_task_id"}'::jsonb),
('a0000001-0000-0000-0000-000000000004', get_brick_id('send_notification'), 3,
'{"recipient": {"source": "step_config", "field": "assign_to"}, "message": {"source": "template", "template": "You have been assigned a task"}}'::jsonb,
'{"notification_sent": "assignment_notification_sent"}'::jsonb);

-- 5. request_information → send_notification + collect_data + validate_data
INSERT INTO public.step_definition_bricks (step_definition_id, brick_id, position, input_config, output_mapping) VALUES
('a0000001-0000-0000-0000-000000000005', get_brick_id('send_notification'), 1,
'{"recipient": {"source": "step_config", "field": "request_from"}, "message": {"source": "step_config", "field": "info_needed"}}'::jsonb,
'{"notification_sent": "request_notification_sent"}'::jsonb),
('a0000001-0000-0000-0000-000000000005', get_brick_id('collect_data'), 2,
'{"field_name": "requested_information", "required": true}'::jsonb,
'{"collected_value": "submitted_information", "validation_status": "information_valid"}'::jsonb),
('a0000001-0000-0000-0000-000000000005', get_brick_id('validate_data'), 3,
'{"field": "submitted_information", "validation_type": "custom"}'::jsonb,
'{"is_valid": "information_validated", "validation_errors": "validation_errors"}'::jsonb);

-- 6. send_reminder → send_notification
INSERT INTO public.step_definition_bricks (step_definition_id, brick_id, position, input_config, output_mapping) VALUES
('a0000001-0000-0000-0000-000000000006', get_brick_id('send_notification'), 1,
'{"recipient": {"source": "step_config", "field": "remind_who"}, "message": {"source": "step_config", "field": "about"}}'::jsonb,
'{"notification_sent": "reminder_sent"}'::jsonb);

-- CLEANUP
DROP FUNCTION IF EXISTS get_brick_id(TEXT);