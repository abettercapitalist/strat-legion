-- Create team_members table to link users to teams
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_in_team TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view team_members" 
  ON public.team_members FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can insert team_members" 
  ON public.team_members FOR INSERT 
  WITH CHECK (is_manager(auth.uid()));

CREATE POLICY "Managers can update team_members" 
  ON public.team_members FOR UPDATE 
  USING (is_manager(auth.uid()));

CREATE POLICY "Managers can delete team_members" 
  ON public.team_members FOR DELETE 
  USING (is_manager(auth.uid()));

-- Seed team_members from existing user_roles
-- First, get the team IDs dynamically
INSERT INTO public.team_members (team_id, user_id)
SELECT 
  CASE ur.role
    WHEN 'account_executive' THEN (SELECT id FROM teams WHERE name = 'sales' LIMIT 1)
    WHEN 'sales_manager' THEN (SELECT id FROM teams WHERE name = 'sales' LIMIT 1)
    WHEN 'general_counsel' THEN (SELECT id FROM teams WHERE name = 'law' LIMIT 1)
    WHEN 'legal_ops' THEN (SELECT id FROM teams WHERE name = 'law' LIMIT 1)
    WHEN 'contract_counsel' THEN (SELECT id FROM teams WHERE name = 'law' LIMIT 1)
    WHEN 'finance_reviewer' THEN (SELECT id FROM teams WHERE name = 'finance' LIMIT 1)
  END as team_id,
  ur.user_id
FROM user_roles ur
WHERE ur.role IN ('account_executive', 'sales_manager', 'general_counsel', 'legal_ops', 'contract_counsel', 'finance_reviewer')
  AND (SELECT id FROM teams WHERE name = 
    CASE ur.role
      WHEN 'account_executive' THEN 'sales'
      WHEN 'sales_manager' THEN 'sales'
      WHEN 'general_counsel' THEN 'law'
      WHEN 'legal_ops' THEN 'law'
      WHEN 'contract_counsel' THEN 'law'
      WHEN 'finance_reviewer' THEN 'finance'
    END LIMIT 1) IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;