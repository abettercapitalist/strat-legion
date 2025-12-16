-- Note: company_id references are included but without FK constraint 
-- since companies table doesn't exist yet. Add FK constraints after creating companies table.

-- Note: workstream_approvals and response_library tables don't exist yet.
-- Creating these tables now for future use.

-- 1. Create workstream_approvals table (needed for approval_decisions)
CREATE TABLE IF NOT EXISTS public.workstream_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workstream_id uuid REFERENCES public.workstreams(id) ON DELETE CASCADE,
  approval_template_id uuid REFERENCES public.approval_templates(id),
  status text DEFAULT 'pending',
  current_gate integer DEFAULT 1,
  submitted_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.workstream_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workstream_approvals" 
  ON public.workstream_approvals FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workstream_approvals" 
  ON public.workstream_approvals FOR ALL USING (true);

-- 2. Create response_library table (needed for response_usage)
CREATE TABLE IF NOT EXISTS public.response_library (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  response_text text NOT NULL,
  category text,
  tags text[],
  success_rate numeric,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.response_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view response_library" 
  ON public.response_library FOR SELECT USING (true);

CREATE POLICY "Law users can manage response_library" 
  ON public.response_library FOR ALL 
  USING (has_role(auth.uid(), 'general_counsel') OR has_role(auth.uid(), 'legal_ops') OR has_role(auth.uid(), 'contract_counsel'));

-- 3. Alter approval_templates to add missing columns
ALTER TABLE public.approval_templates 
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Add unique constraint for company_id + name (only if company_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS approval_templates_company_name_idx 
  ON public.approval_templates (company_id, name) WHERE company_id IS NOT NULL;

-- 4. Create tags table (universal tagging system)
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid,
  tag_name text NOT NULL,
  tag_category text CHECK (tag_category IN ('customer_concern', 'deal_characteristic', 'clause_type', 'risk_factor', 'outcome')),
  description text,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (company_id, tag_name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags" 
  ON public.tags FOR SELECT USING (true);

CREATE POLICY "Law users can manage tags" 
  ON public.tags FOR ALL 
  USING (has_role(auth.uid(), 'general_counsel') OR has_role(auth.uid(), 'legal_ops') OR has_role(auth.uid(), 'contract_counsel'));

-- 5. Create content_tags table (universal tagging)
CREATE TABLE public.content_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL CHECK (content_type IN ('approval_decision', 'deviation_request', 'response_usage', 'objection', 'clause')),
  content_id uuid NOT NULL,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  tagged_by uuid REFERENCES public.profiles(id),
  confidence float CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX content_tags_content_idx ON public.content_tags (content_type, content_id);
CREATE INDEX content_tags_tag_idx ON public.content_tags (tag_id);
CREATE INDEX content_tags_type_idx ON public.content_tags (content_type);

ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view content_tags" 
  ON public.content_tags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage content_tags" 
  ON public.content_tags FOR ALL USING (true);

-- 6. Create approval_decisions table
CREATE TABLE public.approval_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_id uuid REFERENCES public.workstream_approvals(id) ON DELETE CASCADE NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'request_changes')),
  reasoning text,
  decision_factors jsonb,
  decided_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approval_decisions" 
  ON public.approval_decisions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage approval_decisions" 
  ON public.approval_decisions FOR ALL USING (true);

-- 7. Create decision_outcomes table
CREATE TABLE public.decision_outcomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_decision_id uuid REFERENCES public.approval_decisions(id) ON DELETE CASCADE NOT NULL,
  workstream_id uuid REFERENCES public.workstreams(id) ON DELETE CASCADE NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('closed_won', 'closed_lost', 'still_active')),
  outcome_time timestamp with time zone,
  outcome_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view decision_outcomes" 
  ON public.decision_outcomes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage decision_outcomes" 
  ON public.decision_outcomes FOR ALL USING (true);

-- 8. Create response_usage table
CREATE TABLE public.response_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_library_id uuid REFERENCES public.response_library(id) ON DELETE CASCADE NOT NULL,
  workstream_id uuid REFERENCES public.workstreams(id) ON DELETE CASCADE NOT NULL,
  customer_question text,
  response_sent text,
  customer_reaction text CHECK (customer_reaction IN ('accepted', 'requested_changes', 'rejected')),
  effectiveness_rating integer CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  context_notes text,
  used_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.response_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view response_usage" 
  ON public.response_usage FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage response_usage" 
  ON public.response_usage FOR ALL USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_workstream_approvals_updated_at
  BEFORE UPDATE ON public.workstream_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_response_library_updated_at
  BEFORE UPDATE ON public.response_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();