-- Add missing columns to workstream_types table
ALTER TABLE public.workstream_types
ADD COLUMN IF NOT EXISTS approval_template_id uuid REFERENCES public.approval_templates(id),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workstream_types_approval_template 
ON public.workstream_types(approval_template_id);

CREATE INDEX IF NOT EXISTS idx_workstream_types_created_by 
ON public.workstream_types(created_by);