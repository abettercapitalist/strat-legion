-- ============================================================================
-- DAG Workflow Builder: Create missing playbook system tables + add playbook_id
--
-- The refined_brick_architecture migration (20260122) was tracked but never
-- ran against the remote DB. This migration creates the tables needed for
-- the DAG workflow builder if they don't exist.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create playbooks table (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  workstream_type_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbooks_workstream_type ON public.playbooks(workstream_type_id);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- Safe: CREATE POLICY fails silently if already exists via DO block
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbooks' AND policyname = 'Anyone can view active playbooks') THEN
    CREATE POLICY "Anyone can view active playbooks" ON public.playbooks FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbooks' AND policyname = 'Authenticated users can manage playbooks') THEN
    CREATE POLICY "Authenticated users can manage playbooks" ON public.playbooks FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create playbook_patterns table (if missing, needed as FK target)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playbook_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('sequential', 'parallel', 'conditional', 'loop')),
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_patterns_playbook ON public.playbook_patterns(playbook_id);

ALTER TABLE public.playbook_patterns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbook_patterns' AND policyname = 'Anyone can view active patterns') THEN
    CREATE POLICY "Anyone can view active patterns" ON public.playbook_patterns FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbook_patterns' AND policyname = 'Authenticated users can manage patterns') THEN
    CREATE POLICY "Authenticated users can manage patterns" ON public.playbook_patterns FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create playbook_plays table (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playbook_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES public.playbook_patterns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  input_mapping JSONB DEFAULT '{}',
  output_mapping JSONB DEFAULT '{}',
  execution_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_duration_minutes INTEGER,
  sla_hours INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_plays_pattern ON public.playbook_plays(pattern_id);

ALTER TABLE public.playbook_plays ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbook_plays' AND policyname = 'Anyone can view active plays') THEN
    CREATE POLICY "Anyone can view active plays" ON public.playbook_plays FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbook_plays' AND policyname = 'Authenticated users can manage plays') THEN
    CREATE POLICY "Authenticated users can manage plays" ON public.playbook_plays FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add playbook_id column to playbook_plays (direct FK, bypasses patterns)
-- ============================================================================
ALTER TABLE public.playbook_plays ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES public.playbooks(id);

-- Make pattern_id nullable (plays can now belong to a playbook directly)
ALTER TABLE public.playbook_plays ALTER COLUMN pattern_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_playbook_plays_playbook_id ON public.playbook_plays(playbook_id);

-- A play must have at least one parent (pattern_id or playbook_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playbook_plays_has_parent'
  ) THEN
    ALTER TABLE public.playbook_plays ADD CONSTRAINT playbook_plays_has_parent
      CHECK (pattern_id IS NOT NULL OR playbook_id IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create workflow_nodes table (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID NOT NULL REFERENCES public.playbook_plays(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('start', 'brick', 'fork', 'join', 'end', 'decision')),
  brick_id UUID,
  config JSONB NOT NULL DEFAULT '{}',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_play ON public.workflow_nodes(play_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_type ON public.workflow_nodes(node_type);

ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_nodes' AND policyname = 'Anyone can view workflow nodes') THEN
    CREATE POLICY "Anyone can view workflow nodes" ON public.workflow_nodes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_nodes' AND policyname = 'Authenticated users can manage nodes') THEN
    CREATE POLICY "Authenticated users can manage nodes" ON public.workflow_nodes FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Create workflow_edges table (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID NOT NULL REFERENCES public.playbook_plays(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'default' CHECK (edge_type IN ('default', 'conditional', 'error')),
  condition JSONB,
  label TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_edges_play ON public.workflow_edges(play_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON public.workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON public.workflow_edges(target_node_id);

ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_edges' AND policyname = 'Anyone can view workflow edges') THEN
    CREATE POLICY "Anyone can view workflow edges" ON public.workflow_edges FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_edges' AND policyname = 'Authenticated users can manage edges') THEN
    CREATE POLICY "Authenticated users can manage edges" ON public.workflow_edges FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
