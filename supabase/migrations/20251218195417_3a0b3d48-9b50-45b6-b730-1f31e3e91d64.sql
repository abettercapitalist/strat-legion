-- Table 1: workstream_activity
-- Tracks all activity/events on a workstream for timeline views and "at risk" detection
CREATE TABLE public.workstream_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workstream_id UUID NOT NULL REFERENCES public.workstreams(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying by workstream
CREATE INDEX idx_workstream_activity_workstream_id ON public.workstream_activity(workstream_id);
-- Index for "at risk" queries (no activity in last X days)
CREATE INDEX idx_workstream_activity_created_at ON public.workstream_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.workstream_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view workstream_activity"
  ON public.workstream_activity
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert workstream_activity"
  ON public.workstream_activity
  FOR INSERT
  WITH CHECK (true);

-- Table 2: workstream_steps
-- Tracks workflow step instances for each workstream (from the Play's default_workflow)
CREATE TABLE public.workstream_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workstream_id UUID NOT NULL REFERENCES public.workstreams(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  step_type TEXT NOT NULL,
  requirement_type TEXT NOT NULL DEFAULT 'required_immediate',
  required_before TEXT,
  trigger_timing TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  config JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying by workstream
CREATE INDEX idx_workstream_steps_workstream_id ON public.workstream_steps(workstream_id);
-- Index for finding pending steps
CREATE INDEX idx_workstream_steps_status ON public.workstream_steps(status);

-- Enable RLS
ALTER TABLE public.workstream_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view workstream_steps"
  ON public.workstream_steps
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage workstream_steps"
  ON public.workstream_steps
  FOR ALL
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_workstream_steps_updated_at
  BEFORE UPDATE ON public.workstream_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();