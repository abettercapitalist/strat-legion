-- Add parent_id column for team hierarchy
ALTER TABLE public.teams 
ADD COLUMN parent_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add index for efficient child lookups
CREATE INDEX idx_teams_parent_id ON public.teams(parent_id);