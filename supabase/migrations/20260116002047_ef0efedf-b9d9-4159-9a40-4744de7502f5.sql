-- Phase 1: Unified RBAC Migration
-- 1. Consolidate Contract Counsel into Commercial Counsel
-- 2. Update system roles to have proper work routing and manager flags
-- 3. Create function for team-scoped manager access

-- Step 1: Update any user_custom_roles pointing to Contract Counsel to Commercial Counsel
UPDATE user_custom_roles 
SET role_id = 'bbc85d83-9022-41c6-9cf4-169a97c5dc0a'
WHERE role_id = '33333333-3333-3333-3333-333333333333';

-- Step 2: Update any role_permissions pointing to Contract Counsel to Commercial Counsel
UPDATE role_permissions
SET role_id = 'bbc85d83-9022-41c6-9cf4-169a97c5dc0a'
WHERE role_id = '33333333-3333-3333-3333-333333333333';

-- Step 3: Update needs.satisfier_role where it references contract_counsel
UPDATE needs
SET satisfier_role = 'bbc85d83-9022-41c6-9cf4-169a97c5dc0a'
WHERE satisfier_role = 'contract_counsel' OR satisfier_role = '33333333-3333-3333-3333-333333333333';

-- Step 4: Delete the Contract Counsel system role (after all references moved)
DELETE FROM custom_roles WHERE id = '33333333-3333-3333-3333-333333333333';

-- Step 5: Update system roles with proper flags
-- General Counsel is a manager role with work routing
UPDATE custom_roles 
SET is_manager_role = true, 
    is_work_routing = true,
    display_name = 'General Counsel'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Legal Ops (Director of Legal Ops) is a manager role with work routing
UPDATE custom_roles 
SET is_manager_role = true, 
    is_work_routing = true,
    display_name = 'Legal Ops'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Sales Manager is a manager role with work routing
UPDATE custom_roles 
SET is_manager_role = true, 
    is_work_routing = true,
    display_name = 'Sales Manager'
WHERE id = '66666666-6666-6666-6666-666666666666';

-- Account Executive gets work routing
UPDATE custom_roles 
SET is_work_routing = true,
    display_name = 'Account Executive'
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Finance Reviewer gets work routing
UPDATE custom_roles 
SET is_work_routing = true,
    display_name = 'Finance Reviewer'
WHERE id = '77777777-7777-7777-7777-777777777777';

-- Paralegal gets work routing
UPDATE custom_roles 
SET is_work_routing = true,
    display_name = 'Paralegal'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Commercial Counsel should NOT be a manager (practitioners)
UPDATE custom_roles 
SET is_manager_role = false
WHERE id = 'bbc85d83-9022-41c6-9cf4-169a97c5dc0a';

-- Step 6: Create function to check if user is a manager for a specific role/team scope
-- A manager only has elevated access to data related to their team(s)
CREATE OR REPLACE FUNCTION public.is_manager_for_scope(_user_id uuid DEFAULT auth.uid(), scope_role_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_is_manager boolean := false;
  user_role_ids uuid[];
BEGIN
  -- Get all roles the user belongs to that are manager roles
  SELECT array_agg(cr.id) INTO user_role_ids
  FROM user_custom_roles ucr
  JOIN custom_roles cr ON ucr.role_id = cr.id
  WHERE ucr.user_id = _user_id AND cr.is_manager_role = true;

  -- If no manager roles, return false
  IF user_role_ids IS NULL OR array_length(user_role_ids, 1) IS NULL THEN
    RETURN false;
  END IF;

  -- If no scope specified, just check if user has any manager role
  IF scope_role_id IS NULL THEN
    RETURN true;
  END IF;

  -- Check if any of user's manager roles are parents of or equal to the scope role
  -- This implements team-scoped management
  RETURN EXISTS (
    SELECT 1 FROM custom_roles scope_role
    WHERE scope_role.id = scope_role_id
    AND (
      scope_role.id = ANY(user_role_ids)
      OR scope_role.parent_id = ANY(user_role_ids)
    )
  );
END;
$$;

-- Step 7: Create function to get user's role IDs (for filtering)
CREATE OR REPLACE FUNCTION public.get_user_role_ids(_user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_ids uuid[];
BEGIN
  SELECT array_agg(role_id) INTO role_ids
  FROM user_custom_roles
  WHERE user_id = _user_id;
  
  RETURN COALESCE(role_ids, ARRAY[]::uuid[]);
END;
$$;

-- Step 8: Create function to get user's work routing role IDs
CREATE OR REPLACE FUNCTION public.get_user_work_routing_roles(_user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_ids uuid[];
BEGIN
  SELECT array_agg(cr.id) INTO role_ids
  FROM user_custom_roles ucr
  JOIN custom_roles cr ON ucr.role_id = cr.id
  WHERE ucr.user_id = _user_id AND cr.is_work_routing = true;
  
  RETURN COALESCE(role_ids, ARRAY[]::uuid[]);
END;
$$;