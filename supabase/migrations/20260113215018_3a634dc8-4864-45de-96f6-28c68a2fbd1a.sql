-- =====================================================
-- SECURITY FIX: Remove all remaining permissive policies
-- and restrict approval_templates to legal roles
-- =====================================================

-- 1. DROP OLD PERMISSIVE POLICIES (these should have been removed but still exist)

-- approval_decisions
DROP POLICY IF EXISTS "Authenticated users can manage approval_decisions" ON public.approval_decisions;
DROP POLICY IF EXISTS "Authenticated users can view approval_decisions" ON public.approval_decisions;

-- approval_templates (the problematic one exposing business logic)
DROP POLICY IF EXISTS "Authenticated users can view approval_templates" ON public.approval_templates;

-- content_tags
DROP POLICY IF EXISTS "Authenticated users can manage content_tags" ON public.content_tags;
DROP POLICY IF EXISTS "Authenticated users can view content_tags" ON public.content_tags;

-- counterparties
DROP POLICY IF EXISTS "Authenticated users can manage counterparties" ON public.counterparties;
DROP POLICY IF EXISTS "Authenticated users can view counterparties" ON public.counterparties;

-- decision_outcomes
DROP POLICY IF EXISTS "Authenticated users can manage decision_outcomes" ON public.decision_outcomes;
DROP POLICY IF EXISTS "Authenticated users can view decision_outcomes" ON public.decision_outcomes;

-- needs
DROP POLICY IF EXISTS "Authenticated users can manage needs" ON public.needs;
DROP POLICY IF EXISTS "Authenticated users can view needs" ON public.needs;

-- response_usage
DROP POLICY IF EXISTS "Authenticated users can manage response_usage" ON public.response_usage;
DROP POLICY IF EXISTS "Authenticated users can view response_usage" ON public.response_usage;

-- workstream_activity
DROP POLICY IF EXISTS "Authenticated users can insert workstream_activity" ON public.workstream_activity;
DROP POLICY IF EXISTS "Authenticated users can view workstream_activity" ON public.workstream_activity;

-- workstream_approvals
DROP POLICY IF EXISTS "Authenticated users can manage workstream_approvals" ON public.workstream_approvals;
DROP POLICY IF EXISTS "Authenticated users can view workstream_approvals" ON public.workstream_approvals;

-- workstream_steps
DROP POLICY IF EXISTS "Authenticated users can manage workstream_steps" ON public.workstream_steps;
DROP POLICY IF EXISTS "Authenticated users can view workstream_steps" ON public.workstream_steps;

-- workstreams
DROP POLICY IF EXISTS "Authenticated users can manage workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Authenticated users can view workstreams" ON public.workstreams;

-- 2. ADD RESTRICTED SELECT POLICY FOR approval_templates
-- Only legal roles should see approval workflows and thresholds
CREATE POLICY "Law users can view approval_templates"
ON public.approval_templates
FOR SELECT
USING (
  has_role(auth.uid(), 'general_counsel'::app_role) OR 
  has_role(auth.uid(), 'legal_ops'::app_role) OR 
  has_role(auth.uid(), 'contract_counsel'::app_role)
);