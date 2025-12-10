-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  status TEXT DEFAULT 'Draft',
  content TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Authenticated users can view templates"
ON public.templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Law users can create templates"
ON public.templates FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

CREATE POLICY "Law users can update templates"
ON public.templates FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

CREATE POLICY "Law users can delete templates"
ON public.templates FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

-- Create clauses table
CREATE TABLE public.clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  risk_level TEXT DEFAULT 'low',
  is_standard BOOLEAN DEFAULT true,
  business_context TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clauses ENABLE ROW LEVEL SECURITY;

-- RLS policies for clauses
CREATE POLICY "Authenticated users can view clauses"
ON public.clauses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Law users can create clauses"
ON public.clauses FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

CREATE POLICY "Law users can update clauses"
ON public.clauses FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

CREATE POLICY "Law users can delete clauses"
ON public.clauses FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

-- Create template_clauses junction table
CREATE TABLE public.template_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  clause_id UUID REFERENCES public.clauses(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  alternatives_allowed BOOLEAN DEFAULT true,
  approval_required_from TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_clauses ENABLE ROW LEVEL SECURITY;

-- RLS policies for template_clauses
CREATE POLICY "Authenticated users can view template_clauses"
ON public.template_clauses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Law users can manage template_clauses"
ON public.template_clauses FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

-- Create clause_alternatives table
CREATE TABLE public.clause_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_id UUID REFERENCES public.clauses(id) ON DELETE CASCADE NOT NULL,
  alternative_text TEXT NOT NULL,
  use_case TEXT,
  business_impact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clause_alternatives ENABLE ROW LEVEL SECURITY;

-- RLS policies for clause_alternatives
CREATE POLICY "Authenticated users can view clause_alternatives"
ON public.clause_alternatives FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Law users can manage clause_alternatives"
ON public.clause_alternatives FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'general_counsel') OR
  public.has_role(auth.uid(), 'legal_ops') OR
  public.has_role(auth.uid(), 'contract_counsel')
);

-- Add triggers for updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clauses_updated_at
BEFORE UPDATE ON public.clauses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();