-- Enable Row Level Security on tables that have policies defined but RLS not enabled.
-- Without this, the existing policies have no effect and the tables are fully open.

ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstream_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstream_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstream_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstreams ENABLE ROW LEVEL SECURITY;
