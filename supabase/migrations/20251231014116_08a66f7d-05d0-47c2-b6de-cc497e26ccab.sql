-- Create permissions table
CREATE TABLE public.permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL CHECK (module IN ('law', 'sales', 'system')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_roles table (for user-defined roles beyond the app_role enum)
CREATE TABLE public.custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table (maps custom_roles to permissions)
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- Create user_custom_roles table (maps users to custom_roles)
CREATE TABLE public.user_custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions (read-only for authenticated)
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for custom_roles
CREATE POLICY "Authenticated users can view custom_roles"
ON public.custom_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage custom_roles"
ON public.custom_roles FOR ALL
TO authenticated
USING (
    has_role(auth.uid(), 'general_counsel'::app_role) OR 
    has_role(auth.uid(), 'legal_ops'::app_role)
);

-- RLS Policies for role_permissions
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage role_permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (
    has_role(auth.uid(), 'general_counsel'::app_role) OR 
    has_role(auth.uid(), 'legal_ops'::app_role)
);

-- RLS Policies for user_custom_roles
CREATE POLICY "Authenticated users can view user_custom_roles"
ON public.user_custom_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage user_custom_roles"
ON public.user_custom_roles FOR ALL
TO authenticated
USING (
    has_role(auth.uid(), 'general_counsel'::app_role) OR 
    has_role(auth.uid(), 'legal_ops'::app_role)
);

-- Create updated_at trigger for custom_roles
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to check if user has a custom role permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.role_permissions rp ON rp.role_id = ucr.role_id
    WHERE ucr.user_id = _user_id
      AND rp.permission_id = _permission_id
  )
$$;

-- Seed default permissions
INSERT INTO public.permissions (id, name, description, module) VALUES
-- Law Module
('law.templates.view', 'View Templates', 'View contract templates', 'law'),
('law.templates.create', 'Create Templates', 'Create new contract templates', 'law'),
('law.templates.edit', 'Edit Templates', 'Edit existing templates', 'law'),
('law.templates.delete', 'Delete Templates', 'Delete templates', 'law'),
('law.templates.publish', 'Publish Templates', 'Publish templates for use', 'law'),
('law.clauses.view', 'View Clauses', 'View clause library', 'law'),
('law.clauses.create', 'Create Clauses', 'Create new clauses', 'law'),
('law.clauses.edit', 'Edit Clauses', 'Edit existing clauses', 'law'),
('law.clauses.delete', 'Delete Clauses', 'Delete clauses', 'law'),
('law.requests.view', 'View Change Requests', 'View change requests', 'law'),
('law.requests.approve', 'Approve Change Requests', 'Approve or reject change requests', 'law'),
('law.dashboard.view', 'View Learning Dashboard', 'View analytics and insights', 'law'),
-- Sales Module
('sales.deals.view', 'View Deals', 'View deals', 'sales'),
('sales.deals.create', 'Create Deals', 'Create new deals', 'sales'),
('sales.deals.edit', 'Edit Deals', 'Edit deals', 'sales'),
('sales.approvals.view', 'View Approvals', 'View approval queue', 'sales'),
('sales.approvals.approve', 'Approve Deals', 'Approve or reject deals', 'sales'),
-- System
('system.users.view', 'View Users', 'View system users', 'system'),
('system.users.manage', 'Manage Users', 'Create, edit, delete users', 'system'),
('system.roles.view', 'View Roles', 'View roles and permissions', 'system'),
('system.roles.manage', 'Manage Roles', 'Create, edit, delete roles', 'system'),
('system.settings.view', 'View Settings', 'View system settings', 'system'),
('system.settings.manage', 'Manage Settings', 'Modify system settings', 'system');

-- Seed default roles
INSERT INTO public.custom_roles (id, name, description, is_system_role) VALUES
('11111111-1111-1111-1111-111111111111', 'General Counsel', 'Chief legal officer with full access to law module and system administration', true),
('22222222-2222-2222-2222-222222222222', 'Director of Legal Ops', 'Oversees legal operations with full administrative access', true),
('33333333-3333-3333-3333-333333333333', 'Contract Counsel', 'Drafts and reviews contracts', true),
('44444444-4444-4444-4444-444444444444', 'Paralegal', 'Supports legal team with document preparation', true),
('55555555-5555-5555-5555-555555555555', 'Account Executive', 'Sales representative managing deals', true),
('66666666-6666-6666-6666-666666666666', 'Sales Manager', 'Manages sales team and approves deals', true),
('77777777-7777-7777-7777-777777777777', 'Finance Reviewer', 'Reviews financial aspects of deals', true);

-- Seed role permissions (General Counsel - all permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM public.permissions;

-- Director of Legal Ops - all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM public.permissions;

-- Contract Counsel permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('33333333-3333-3333-3333-333333333333', 'law.templates.view'),
('33333333-3333-3333-3333-333333333333', 'law.templates.create'),
('33333333-3333-3333-3333-333333333333', 'law.templates.edit'),
('33333333-3333-3333-3333-333333333333', 'law.templates.publish'),
('33333333-3333-3333-3333-333333333333', 'law.clauses.view'),
('33333333-3333-3333-3333-333333333333', 'law.clauses.create'),
('33333333-3333-3333-3333-333333333333', 'law.clauses.edit'),
('33333333-3333-3333-3333-333333333333', 'law.requests.view'),
('33333333-3333-3333-3333-333333333333', 'law.requests.approve'),
('33333333-3333-3333-3333-333333333333', 'law.dashboard.view');

-- Paralegal permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('44444444-4444-4444-4444-444444444444', 'law.templates.view'),
('44444444-4444-4444-4444-444444444444', 'law.clauses.view'),
('44444444-4444-4444-4444-444444444444', 'law.requests.view'),
('44444444-4444-4444-4444-444444444444', 'law.dashboard.view');

-- Account Executive permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('55555555-5555-5555-5555-555555555555', 'sales.deals.view'),
('55555555-5555-5555-5555-555555555555', 'sales.deals.create'),
('55555555-5555-5555-5555-555555555555', 'sales.deals.edit'),
('55555555-5555-5555-5555-555555555555', 'sales.approvals.view');

-- Sales Manager permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('66666666-6666-6666-6666-666666666666', 'sales.deals.view'),
('66666666-6666-6666-6666-666666666666', 'sales.deals.create'),
('66666666-6666-6666-6666-666666666666', 'sales.deals.edit'),
('66666666-6666-6666-6666-666666666666', 'sales.approvals.view'),
('66666666-6666-6666-6666-666666666666', 'sales.approvals.approve');

-- Finance Reviewer permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('77777777-7777-7777-7777-777777777777', 'sales.deals.view'),
('77777777-7777-7777-7777-777777777777', 'sales.approvals.view');