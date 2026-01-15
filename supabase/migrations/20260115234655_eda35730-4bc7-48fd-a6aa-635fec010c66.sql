-- Fix function search path security warnings
-- Set search_path to public for all new functions

CREATE OR REPLACE FUNCTION public.is_role_member(role_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_custom_roles ucr
    WHERE ucr.role_id = role_uuid AND ucr.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_role_members(role_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT user_id FROM public.user_custom_roles WHERE role_id = role_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
    AND ur.role IN ('general_counsel', 'legal_ops', 'sales_manager')
  ) THEN
    RETURN true;
  END IF;
  
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

CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
  ) THEN
    RETURN true;
  END IF;
  
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

CREATE OR REPLACE FUNCTION public.has_role_or_custom_role(
  _user_id uuid,
  legacy_role app_role DEFAULT NULL,
  custom_role_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF legacy_role IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = legacy_role
  ) THEN
    RETURN true;
  END IF;
  
  IF custom_role_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_custom_roles ucr
    WHERE ucr.user_id = _user_id AND ucr.role_id = custom_role_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;