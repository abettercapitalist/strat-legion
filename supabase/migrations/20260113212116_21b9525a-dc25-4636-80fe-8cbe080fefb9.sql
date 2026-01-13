
-- ============================================================================
-- COMPREHENSIVE RLS SECURITY HARDENING MIGRATION
-- Fixes overly permissive policies on 10 tables
-- ============================================================================

-- PHASE 1: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Helper function to check if user is a manager role
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('general_counsel', 'legal_ops', 'sales_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check workstream access
CREATE OR REPLACE FUNCTION public.has_workstream_access(ws_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN 
    -- User is owner
    EXISTS (
      SELECT 1 FROM public.workstreams WHERE id = ws_id AND owner_id = _user_id
    ) 
    OR 
    -- User has assigned need matching their role
    EXISTS (
      SELECT 1 FROM public.needs n
      JOIN public.user_roles ur ON ur.user_id = _user_id
      WHERE n.workstream_id = ws_id 
        AND n.satisfier_role = ur.role::text
        AND n.status = 'open'
    )
    OR 
    -- User is a manager
    public.is_manager(_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if user has a business role (can create workstreams)
CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('general_counsel', 'legal_ops', 'contract_counsel', 'account_executive', 'sales_manager', 'finance_reviewer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- PHASE 2: DROP EXISTING PERMISSIVE POLICIES
-- ============================================================================

-- counterparties
DROP POLICY IF EXISTS "Anyone can view counterparties" ON public.counterparties;
DROP POLICY IF EXISTS "Anyone can create counterparties" ON public.counterparties;
DROP POLICY IF EXISTS "Anyone can update counterparties" ON public.counterparties;
DROP POLICY IF EXISTS "Anyone can delete counterparties" ON public.counterparties;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.counterparties;

-- workstreams
DROP POLICY IF EXISTS "Anyone can view workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Anyone can create workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Anyone can update workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Anyone can delete workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.workstreams;

-- needs
DROP POLICY IF EXISTS "Anyone can view needs" ON public.needs;
DROP POLICY IF EXISTS "Anyone can create needs" ON public.needs;
DROP POLICY IF EXISTS "Anyone can update needs" ON public.needs;
DROP POLICY IF EXISTS "Anyone can delete needs" ON public.needs;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.needs;

-- workstream_approvals
DROP POLICY IF EXISTS "Anyone can view workstream_approvals" ON public.workstream_approvals;
DROP POLICY IF EXISTS "Anyone can create workstream_approvals" ON public.workstream_approvals;
DROP POLICY IF EXISTS "Anyone can update workstream_approvals" ON public.workstream_approvals;
DROP POLICY IF EXISTS "Anyone can delete workstream_approvals" ON public.workstream_approvals;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.workstream_approvals;

-- approval_decisions
DROP POLICY IF EXISTS "Anyone can view approval_decisions" ON public.approval_decisions;
DROP POLICY IF EXISTS "Anyone can create approval_decisions" ON public.approval_decisions;
DROP POLICY IF EXISTS "Anyone can update approval_decisions" ON public.approval_decisions;
DROP POLICY IF EXISTS "Anyone can delete approval_decisions" ON public.approval_decisions;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.approval_decisions;

-- decision_outcomes
DROP POLICY IF EXISTS "Anyone can view decision_outcomes" ON public.decision_outcomes;
DROP POLICY IF EXISTS "Anyone can create decision_outcomes" ON public.decision_outcomes;
DROP POLICY IF EXISTS "Anyone can update decision_outcomes" ON public.decision_outcomes;
DROP POLICY IF EXISTS "Anyone can delete decision_outcomes" ON public.decision_outcomes;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.decision_outcomes;

-- workstream_steps
DROP POLICY IF EXISTS "Anyone can view workstream_steps" ON public.workstream_steps;
DROP POLICY IF EXISTS "Anyone can create workstream_steps" ON public.workstream_steps;
DROP POLICY IF EXISTS "Anyone can update workstream_steps" ON public.workstream_steps;
DROP POLICY IF EXISTS "Anyone can delete workstream_steps" ON public.workstream_steps;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.workstream_steps;

-- response_usage
DROP POLICY IF EXISTS "Anyone can view response_usage" ON public.response_usage;
DROP POLICY IF EXISTS "Anyone can create response_usage" ON public.response_usage;
DROP POLICY IF EXISTS "Anyone can update response_usage" ON public.response_usage;
DROP POLICY IF EXISTS "Anyone can delete response_usage" ON public.response_usage;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.response_usage;

-- content_tags
DROP POLICY IF EXISTS "Anyone can view content_tags" ON public.content_tags;
DROP POLICY IF EXISTS "Anyone can create content_tags" ON public.content_tags;
DROP POLICY IF EXISTS "Anyone can update content_tags" ON public.content_tags;
DROP POLICY IF EXISTS "Anyone can delete content_tags" ON public.content_tags;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.content_tags;

-- workstream_activity
DROP POLICY IF EXISTS "Anyone can view workstream_activity" ON public.workstream_activity;
DROP POLICY IF EXISTS "Anyone can create workstream_activity" ON public.workstream_activity;
DROP POLICY IF EXISTS "Anyone can insert workstream_activity" ON public.workstream_activity;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.workstream_activity;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.workstream_activity;

-- PHASE 3: CREATE NEW RESTRICTIVE POLICIES
-- ============================================================================

-- ==================== WORKSTREAMS ====================
-- SELECT: Owner, managers, or users with assigned needs
CREATE POLICY "Users can view accessible workstreams"
ON public.workstreams FOR SELECT
USING (
  owner_id = auth.uid()
  OR public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.needs n
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE n.workstream_id = workstreams.id
      AND n.satisfier_role = ur.role::text
      AND n.status = 'open'
  )
);

-- INSERT: Any business role
CREATE POLICY "Business roles can create workstreams"
ON public.workstreams FOR INSERT
WITH CHECK (public.has_business_role(auth.uid()));

-- UPDATE: Owner or managers
CREATE POLICY "Owners and managers can update workstreams"
ON public.workstreams FOR UPDATE
USING (owner_id = auth.uid() OR public.is_manager(auth.uid()));

-- DELETE: Managers only
CREATE POLICY "Managers can delete workstreams"
ON public.workstreams FOR DELETE
USING (public.is_manager(auth.uid()));

-- ==================== COUNTERPARTIES ====================
-- SELECT: Users who have workstreams with this counterparty, or managers
CREATE POLICY "Users can view related counterparties"
ON public.counterparties FOR SELECT
USING (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.counterparty_id = counterparties.id
      AND public.has_workstream_access(w.id, auth.uid())
  )
);

-- INSERT: Business roles
CREATE POLICY "Business roles can create counterparties"
ON public.counterparties FOR INSERT
WITH CHECK (public.has_business_role(auth.uid()));

-- UPDATE: Users with related workstreams or managers
CREATE POLICY "Authorized users can update counterparties"
ON public.counterparties FOR UPDATE
USING (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.counterparty_id = counterparties.id
      AND w.owner_id = auth.uid()
  )
);

-- DELETE: Managers only
CREATE POLICY "Managers can delete counterparties"
ON public.counterparties FOR DELETE
USING (public.is_manager(auth.uid()));

-- ==================== NEEDS ====================
-- SELECT: Workstream owner, assigned role, or managers
CREATE POLICY "Users can view relevant needs"
ON public.needs FOR SELECT
USING (
  public.is_manager(auth.uid())
  OR satisfied_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = needs.workstream_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = needs.satisfier_role
  )
);

-- INSERT: Workstream owners or managers
CREATE POLICY "Owners and managers can create needs"
ON public.needs FOR INSERT
WITH CHECK (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = workstream_id AND w.owner_id = auth.uid()
  )
);

-- UPDATE: Assigned users, workstream owners, or managers
CREATE POLICY "Authorized users can update needs"
ON public.needs FOR UPDATE
USING (
  public.is_manager(auth.uid())
  OR satisfied_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = needs.workstream_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = needs.satisfier_role
  )
);

-- DELETE: Workstream owners or managers
CREATE POLICY "Owners and managers can delete needs"
ON public.needs FOR DELETE
USING (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = needs.workstream_id AND w.owner_id = auth.uid()
  )
);

-- ==================== WORKSTREAM_APPROVALS ====================
-- SELECT: Workstream access or in approval chain
CREATE POLICY "Users can view relevant approvals"
ON public.workstream_approvals FOR SELECT
USING (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = workstream_approvals.workstream_id
      AND public.has_workstream_access(w.id, auth.uid())
  )
);

-- INSERT: Workstream owners or managers (edge function uses service role)
CREATE POLICY "Owners and managers can create approvals"
ON public.workstream_approvals FOR INSERT
WITH CHECK (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = workstream_id AND w.owner_id = auth.uid()
  )
);

-- UPDATE: Managers only (status changes)
CREATE POLICY "Managers can update approvals"
ON public.workstream_approvals FOR UPDATE
USING (public.is_manager(auth.uid()));

-- DELETE: Managers only
CREATE POLICY "Managers can delete approvals"
ON public.workstream_approvals FOR DELETE
USING (public.is_manager(auth.uid()));

-- ==================== APPROVAL_DECISIONS ====================
-- SELECT: Decision maker, workstream owner, or managers
CREATE POLICY "Users can view relevant decisions"
ON public.approval_decisions FOR SELECT
USING (
  decided_by = auth.uid()
  OR public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstream_approvals wa
    JOIN public.workstreams w ON w.id = wa.workstream_id
    WHERE wa.id = approval_decisions.approval_id
      AND w.owner_id = auth.uid()
  )
);

-- INSERT: Managers and assigned approvers (edge function uses service role)
CREATE POLICY "Authorized users can create decisions"
ON public.approval_decisions FOR INSERT
WITH CHECK (
  public.is_manager(auth.uid())
  OR decided_by = auth.uid()
);

-- No UPDATE/DELETE - decisions are immutable audit records

-- ==================== DECISION_OUTCOMES ====================
-- SELECT: Workstream owner, decision maker, or managers
CREATE POLICY "Users can view relevant outcomes"
ON public.decision_outcomes FOR SELECT
USING (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = decision_outcomes.workstream_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.approval_decisions ad
    WHERE ad.id = decision_outcomes.approval_decision_id AND ad.decided_by = auth.uid()
  )
);

-- INSERT: System/edge function (uses service role), managers as backup
CREATE POLICY "Managers can create outcomes"
ON public.decision_outcomes FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));

-- No UPDATE/DELETE - outcomes are immutable audit records

-- ==================== WORKSTREAM_STEPS ====================
-- SELECT: Workstream access
CREATE POLICY "Users can view accessible workstream steps"
ON public.workstream_steps FOR SELECT
USING (public.has_workstream_access(workstream_id, auth.uid()));

-- INSERT: Workstream owners or managers
CREATE POLICY "Owners and managers can create steps"
ON public.workstream_steps FOR INSERT
WITH CHECK (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = workstream_id AND w.owner_id = auth.uid()
  )
);

-- UPDATE: Workstream access (for completing steps)
CREATE POLICY "Authorized users can update steps"
ON public.workstream_steps FOR UPDATE
USING (public.has_workstream_access(workstream_id, auth.uid()));

-- DELETE: Workstream owners or managers
CREATE POLICY "Owners and managers can delete steps"
ON public.workstream_steps FOR DELETE
USING (
  public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = workstream_steps.workstream_id AND w.owner_id = auth.uid()
  )
);

-- ==================== RESPONSE_USAGE ====================
-- SELECT: Creator, workstream owner, or managers
CREATE POLICY "Users can view relevant response usage"
ON public.response_usage FOR SELECT
USING (
  used_by = auth.uid()
  OR public.is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.workstreams w
    WHERE w.id = response_usage.workstream_id AND w.owner_id = auth.uid()
  )
);

-- INSERT: Any authenticated user with workstream access
CREATE POLICY "Users can log response usage"
ON public.response_usage FOR INSERT
WITH CHECK (public.has_workstream_access(workstream_id, auth.uid()));

-- UPDATE: Creator only
CREATE POLICY "Users can update own usage records"
ON public.response_usage FOR UPDATE
USING (used_by = auth.uid());

-- DELETE: Creator or managers
CREATE POLICY "Authorized users can delete usage records"
ON public.response_usage FOR DELETE
USING (used_by = auth.uid() OR public.is_manager(auth.uid()));

-- ==================== CONTENT_TAGS ====================
-- SELECT: Tagger or managers
CREATE POLICY "Users can view relevant tags"
ON public.content_tags FOR SELECT
USING (tagged_by = auth.uid() OR public.is_manager(auth.uid()));

-- INSERT: Any authenticated user
CREATE POLICY "Authenticated users can create tags"
ON public.content_tags FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Tagger or managers
CREATE POLICY "Authorized users can update tags"
ON public.content_tags FOR UPDATE
USING (tagged_by = auth.uid() OR public.is_manager(auth.uid()));

-- DELETE: Tagger or managers
CREATE POLICY "Authorized users can delete tags"
ON public.content_tags FOR DELETE
USING (tagged_by = auth.uid() OR public.is_manager(auth.uid()));

-- ==================== WORKSTREAM_ACTIVITY ====================
-- SELECT: Workstream access
CREATE POLICY "Users can view accessible activity"
ON public.workstream_activity FOR SELECT
USING (public.has_workstream_access(workstream_id, auth.uid()));

-- INSERT: Workstream participants
CREATE POLICY "Participants can log activity"
ON public.workstream_activity FOR INSERT
WITH CHECK (public.has_workstream_access(workstream_id, auth.uid()));

-- No UPDATE/DELETE - activity logs are immutable
