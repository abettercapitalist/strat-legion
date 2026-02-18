-- Ensure profiles exist for all test users and emails are in sync

INSERT INTO public.profiles (id, email, full_name, title)
VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'marcus.johnson@testco.com', 'Marcus Johnson', 'Account Executive'),
  ('aaaa0002-0002-0002-0002-000000000002', 'lisa.park@testco.com', 'Lisa Park', 'Sales Manager'),
  ('aaaa0003-0003-0003-0003-000000000003', 'david.kim@testco.com', 'David Kim', 'Finance Reviewer'),
  ('aaaa0004-0004-0004-0004-000000000004', 'rachel.torres@testco.com', 'Rachel Torres', 'Contract Counsel')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  title = EXCLUDED.title;
