-- Fix RLS infinite recursion between workstreams and needs tables
-- The issue: workstreams SELECT policy references needs, needs SELECT policy references workstreams

-- Step 1: Update workstreams SELECT policy to use existing SECURITY DEFINER function
-- This breaks the recursion because has_workstream_access() bypasses RLS internally
DROP POLICY IF EXISTS "Users can view accessible workstreams" ON workstreams;
CREATE POLICY "Users can view accessible workstreams" ON workstreams
  FOR SELECT USING (has_workstream_access(auth.uid(), id));

-- Step 2: Update needs SELECT policy to avoid referencing workstreams in a way that triggers RLS
-- Use direct owner check via subquery that won't recurse
DROP POLICY IF EXISTS "Users can view relevant needs" ON needs;
CREATE POLICY "Users can view relevant needs" ON needs
  FOR SELECT USING (
    -- Manager can see all
    is_manager(auth.uid())
    -- User satisfied this need
    OR satisfied_by = auth.uid()
    -- User owns the workstream (direct check, won't trigger workstreams RLS due to column reference)
    OR workstream_id IN (
      SELECT id FROM workstreams WHERE owner_id = auth.uid()
    )
    -- User has the satisfier role (legacy app_role)
    OR (
      satisfier_type = 'role' AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text = needs.satisfier_role
      )
    )
    -- User has the custom role
    OR (
      satisfier_type = 'custom_role' AND EXISTS (
        SELECT 1 FROM user_custom_roles ucr
        WHERE ucr.user_id = auth.uid() AND ucr.role_id::text = needs.satisfier_role
      )
    )
  );