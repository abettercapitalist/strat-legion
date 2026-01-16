-- Drop the broken policy with incorrect argument order
DROP POLICY IF EXISTS "Users can view accessible workstreams" ON public.workstreams;

-- Recreate with correct argument order: has_workstream_access(ws_id, user_id)
CREATE POLICY "Users can view accessible workstreams" ON public.workstreams
  FOR SELECT
  USING (has_workstream_access(id, auth.uid()));