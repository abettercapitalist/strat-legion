INSERT INTO storage.buckets (id, name, public)
VALUES ('workstream-documents', 'workstream-documents', false)
ON CONFLICT (id) DO NOTHING;