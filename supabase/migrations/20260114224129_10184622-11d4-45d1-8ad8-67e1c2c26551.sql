-- Create teams table for dynamic team categories
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (is_manager(auth.uid()));

-- Seed default teams
INSERT INTO public.teams (name, display_name, is_default) VALUES
  ('Sales', 'Sales', true),
  ('Law', 'Law', true),
  ('Finance', 'Finance', true),
  ('Pro Services', 'Pro Services', true);

-- Remove the hardcoded check constraint from workstream_types
ALTER TABLE public.workstream_types 
  DROP CONSTRAINT IF EXISTS workstream_types_team_category_check;