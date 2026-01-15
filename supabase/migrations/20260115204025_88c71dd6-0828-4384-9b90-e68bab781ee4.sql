-- Add play_approval_config column to workstream_types
ALTER TABLE workstream_types 
ADD COLUMN IF NOT EXISTS play_approval_config jsonb DEFAULT NULL;

COMMENT ON COLUMN workstream_types.play_approval_config IS 
  'Configuration for who must approve the Play before activation';

-- Add column to track which steps this approval covers
ALTER TABLE workstream_approvals 
ADD COLUMN IF NOT EXISTS approves_step_ids text[] DEFAULT '{}';

COMMENT ON COLUMN workstream_approvals.approves_step_ids IS 
  'Array of step_ids that this approval covers';