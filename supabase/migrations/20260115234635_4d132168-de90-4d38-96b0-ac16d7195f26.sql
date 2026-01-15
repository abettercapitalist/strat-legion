-- =====================================================
-- UNIFIED RBAC + RLS SYSTEM MIGRATION
-- Extends custom_roles to serve as both permission groups
-- AND work routing teams. Creates unified RLS functions.
-- =====================================================

-- 1. Extend custom_roles table with new columns
ALTER TABLE public.custom_roles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.custom_roles(id),
  ADD COLUMN IF NOT EXISTS is_work_routing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_manager_role BOOLEAN NOT NULL DEFAULT false;

-- 2. Add index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_custom_roles_parent_id ON public.custom_roles(parent_id);
CREATE INDEX IF NOT EXISTS idx_custom_roles_work_routing ON public.custom_roles(is_work_routing) WHERE is_work_routing = true;

-- 3. Extend user_custom_roles with role_in_group
ALTER TABLE public.user_custom_roles
  ADD COLUMN IF NOT EXISTS role_in_group TEXT DEFAULT 'member';

-- =====================================================
-- NEW UNIFIED RLS HELPER FUNCTIONS
-- These check BOTH user_roles (legacy) AND user_custom_roles (new)
-- =====================================================

-- 4. Check if user is member of a custom role
CREATE OR REPLACE FUNCTION public.is_role_member(role_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_custom_roles ucr
    WHERE ucr.role_id = role_uuid AND ucr.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Get all role members
CREATE OR REPLACE FUNCTION public.get_role_members(role_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT user_id FROM public.user_custom_roles WHERE role_id = role_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. Updated is_manager: checks legacy user_roles OR is_manager_role custom roles
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check legacy user_roles for manager roles
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
    AND ur.role IN ('general_counsel', 'legal_ops', 'sales_manager')
  ) THEN
    RETURN true;
  END IF;
  
  -- Check custom_roles with is_manager_role flag
  IF EXISTS (
    SELECT 1 
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON cr.id = ucr.role_id
    WHERE ucr.user_id = _user_id
    AND cr.is_manager_role = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 7. Updated has_business_role: checks legacy OR work_routing custom roles
CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check legacy user_roles
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check custom_roles with is_work_routing flag
  IF EXISTS (
    SELECT 1 
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON cr.id = ucr.role_id
    WHERE ucr.user_id = _user_id
    AND cr.is_work_routing = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 8. Check if user has a specific legacy role OR is member of custom role by UUID
CREATE OR REPLACE FUNCTION public.has_role_or_custom_role(
  _user_id uuid,
  legacy_role app_role DEFAULT NULL,
  custom_role_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check legacy role if provided
  IF legacy_role IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = legacy_role
  ) THEN
    RETURN true;
  END IF;
  
  -- Check custom role if provided
  IF custom_role_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_custom_roles ucr
    WHERE ucr.user_id = _user_id AND ucr.role_id = custom_role_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- =====================================================
-- MIGRATE EXISTING TEAMS TO CUSTOM_ROLES
-- =====================================================

-- 9. Migrate teams to custom_roles with is_work_routing = true
INSERT INTO public.custom_roles (id, name, display_name, description, is_system_role, is_work_routing, is_manager_role, parent_id)
SELECT 
  t.id,
  t.name,
  t.display_name,
  t.description,
  COALESCE(t.is_default, false),
  true,  -- is_work_routing
  false, -- is_manager_role (set manually later if needed)
  t.parent_id
FROM public.teams t
WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles cr WHERE cr.id = t.id)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_work_routing = true,
  parent_id = EXCLUDED.parent_id;

-- 10. Migrate team_members to user_custom_roles
INSERT INTO public.user_custom_roles (user_id, role_id, role_in_group)
SELECT 
  tm.user_id,
  tm.team_id,
  COALESCE(tm.role_in_team, 'member')
FROM public.team_members tm
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_custom_roles ucr 
  WHERE ucr.user_id = tm.user_id AND ucr.role_id = tm.team_id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE RLS POLICY ON NEEDS FOR UNIFIED ACCESS
-- =====================================================

-- 11. Drop existing needs SELECT policy and recreate with unified check
DROP POLICY IF EXISTS "Users can view relevant needs" ON public.needs;

CREATE POLICY "Users can view relevant needs" ON public.needs
FOR SELECT USING (
  -- Manager access
  is_manager(auth.uid()) 
  -- Direct assignment
  OR satisfied_by = auth.uid()
  -- Workstream owner
  OR EXISTS (
    SELECT 1 FROM workstreams w 
    WHERE w.id = needs.workstream_id AND w.owner_id = auth.uid()
  )
  -- Legacy: role string match (satisfier_role contains app_role name)
  OR (satisfier_type = 'role' AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role::text = needs.satisfier_role
  ))
  -- New: custom_role membership (satisfier_role contains custom_roles UUID)
  OR (satisfier_type = 'custom_role' AND EXISTS (
    SELECT 1 FROM user_custom_roles ucr
    WHERE ucr.user_id = auth.uid() AND ucr.role_id::text = needs.satisfier_role
  ))
);