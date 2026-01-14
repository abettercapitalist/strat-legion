-- Add auto_approval_config JSONB column to workstream_types table
ALTER TABLE public.workstream_types
ADD COLUMN auto_approval_config JSONB DEFAULT NULL;

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN public.workstream_types.auto_approval_config IS 'Stores auto-approval standards per counterparty tier and deviation routing rules';