-- Create needs table to track all explicit needs for workstreams
CREATE TABLE public.needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workstream_id UUID NOT NULL,
  
  -- What kind of need is this?
  need_type TEXT NOT NULL, -- 'approval', 'document', 'information', 'review', 'action'
  
  -- Human-readable description
  description TEXT NOT NULL,
  
  -- Who/what can satisfy this need?
  satisfier_role TEXT, -- 'finance', 'legal', 'sales_manager', etc.
  satisfier_type TEXT DEFAULT 'role', -- 'role', 'user', 'system', 'external'
  
  -- State
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'expressed', 'committed', 'satisfied'
  
  -- Timing
  required_before TEXT, -- 'signature', 'closing_approval', 'contract_sent', etc.
  due_at TIMESTAMPTZ,
  
  -- Satisfaction tracking
  satisfied_at TIMESTAMPTZ,
  satisfied_by UUID,
  satisfaction_reference_type TEXT, -- 'approval', 'document', 'step', 'external'
  satisfaction_reference_id UUID,
  
  -- Provenance (constraints must have a source)
  source_type TEXT NOT NULL, -- 'workstream_type', 'approval_template', 'manual', 'system'
  source_id UUID,
  source_reason TEXT, -- Why does this need exist?
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_needs_workstream_id ON public.needs(workstream_id);
CREATE INDEX idx_needs_status ON public.needs(status);
CREATE INDEX idx_needs_satisfier_role ON public.needs(satisfier_role);
CREATE INDEX idx_needs_need_type ON public.needs(need_type);

-- Enable RLS
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view needs"
ON public.needs FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage needs"
ON public.needs FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_needs_updated_at
BEFORE UPDATE ON public.needs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add default_needs column to workstream_types for Play configuration
ALTER TABLE public.workstream_types
ADD COLUMN default_needs JSONB DEFAULT '[]'::jsonb;