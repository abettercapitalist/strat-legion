-- Fix RLS helper functions broken by the role consolidation.
--
-- The tables were consolidated:
--   custom_roles  → roles
--   user_custom_roles → user_roles (with role_id UUID FK → roles.id)
--
-- But these functions still referenced the old user_roles.role column,
-- user_custom_roles, and custom_roles — all of which no longer exist.
-- This was latent until RLS was enabled on workstream_types (20260216000000),
-- activating a write policy that calls has_role(), which crashes with:
--   column "role" does not exist (42703)

-- 1. has_role: join through roles.name instead of the old enum column
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = _role::text
  )
$$;

-- 2. is_manager: use roles.is_manager_role flag
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.is_manager_role = true
  )
$$;

-- 3. has_business_role: use roles.is_work_routing flag
CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.is_work_routing = true
  )
$$;

-- 4. has_workstream_access: replace inline ur.role::text with join
CREATE OR REPLACE FUNCTION public.has_workstream_access(ws_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN
    -- Owner
    EXISTS (SELECT 1 FROM public.workstreams WHERE id = ws_id AND owner_id = _user_id)
    OR
    -- User has a role that satisfies a need on this workstream
    EXISTS (
      SELECT 1 FROM public.needs n
      JOIN public.user_roles ur ON ur.user_id = _user_id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE n.workstream_id = ws_id
        AND n.satisfier_role = r.name
        AND n.status = 'open'
    )
    OR
    -- Manager
    public.is_manager(_user_id);
END;
$$;

-- 5. has_role_or_custom_role: now redundant (single user_roles table),
--    but rewrite for compatibility with any callers
CREATE OR REPLACE FUNCTION public.has_role_or_custom_role(
  _user_id uuid,
  legacy_role app_role DEFAULT NULL,
  custom_role_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF legacy_role IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND r.name = legacy_role::text
  ) THEN
    RETURN true;
  END IF;

  IF custom_role_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role_id = custom_role_id
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 6. Fix needs SELECT policy that had inline ur.role::text references
DROP POLICY IF EXISTS "Users can view relevant needs" ON needs;
CREATE POLICY "Users can view relevant needs" ON needs
  FOR SELECT USING (
    is_manager(auth.uid())
    OR satisfied_by = auth.uid()
    OR workstream_id IN (
      SELECT id FROM workstreams WHERE owner_id = auth.uid()
    )
    OR (
      satisfier_type = 'role' AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.name = needs.satisfier_role
      )
    )
    OR (
      satisfier_type = 'custom_role' AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role_id::text = needs.satisfier_role
      )
    )
  );
