-- Add missing columns to workstream_types table
ALTER TABLE public.workstream_types 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Draft',
ADD COLUMN IF NOT EXISTS team_category text;

-- Add check constraints
ALTER TABLE public.workstream_types 
ADD CONSTRAINT workstream_types_status_check 
CHECK (status IN ('Draft', 'Active', 'Archived'));

ALTER TABLE public.workstream_types 
ADD CONSTRAINT workstream_types_team_category_check 
CHECK (team_category IN ('Sales', 'Law', 'Finance', 'Pro Services'));

-- Update existing rows to have Active status
UPDATE public.workstream_types SET status = 'Active' WHERE status IS NULL OR status = 'Draft';