-- Seed test users for approval workflow testing.
-- Each user gets a deterministic UUID, a simple password, and a role assignment.
-- Password for all test users: password123
-- ON CONFLICT DO NOTHING ensures idempotency.

-- 1. Insert into auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'aaaa0001-0001-0001-0001-000000000001',
  'authenticated', 'authenticated',
  'marcus.johnson@example.com',
  '$2b$10$/nRhSAQn9l/q6bF3709HYezxyh7jf9CKVAzefjGqQlnP2FXSqe/DG',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Marcus Johnson","title":"Account Executive"}',
  now(), now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaa0002-0002-0002-0002-000000000002',
  'authenticated', 'authenticated',
  'lisa.park@example.com',
  '$2b$10$/nRhSAQn9l/q6bF3709HYezxyh7jf9CKVAzefjGqQlnP2FXSqe/DG',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Lisa Park","title":"Sales Manager"}',
  now(), now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaa0003-0003-0003-0003-000000000003',
  'authenticated', 'authenticated',
  'david.kim@example.com',
  '$2b$10$/nRhSAQn9l/q6bF3709HYezxyh7jf9CKVAzefjGqQlnP2FXSqe/DG',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"David Kim","title":"Finance Reviewer"}',
  now(), now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaa0004-0004-0004-0004-000000000004',
  'authenticated', 'authenticated',
  'rachel.torres@example.com',
  '$2b$10$/nRhSAQn9l/q6bF3709HYezxyh7jf9CKVAzefjGqQlnP2FXSqe/DG',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Rachel Torres","title":"Contract Counsel"}',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert auth.identities so email login works
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES
(
  'aaaa0001-0001-0001-0001-000000000001',
  'aaaa0001-0001-0001-0001-000000000001',
  'marcus.johnson@example.com',
  jsonb_build_object('sub', 'aaaa0001-0001-0001-0001-000000000001', 'email', 'marcus.johnson@example.com', 'email_verified', true),
  'email', now(), now(), now()
),
(
  'aaaa0002-0002-0002-0002-000000000002',
  'aaaa0002-0002-0002-0002-000000000002',
  'lisa.park@example.com',
  jsonb_build_object('sub', 'aaaa0002-0002-0002-0002-000000000002', 'email', 'lisa.park@example.com', 'email_verified', true),
  'email', now(), now(), now()
),
(
  'aaaa0003-0003-0003-0003-000000000003',
  'aaaa0003-0003-0003-0003-000000000003',
  'david.kim@example.com',
  jsonb_build_object('sub', 'aaaa0003-0003-0003-0003-000000000003', 'email', 'david.kim@example.com', 'email_verified', true),
  'email', now(), now(), now()
),
(
  'aaaa0004-0004-0004-0004-000000000004',
  'aaaa0004-0004-0004-0004-000000000004',
  'rachel.torres@example.com',
  jsonb_build_object('sub', 'aaaa0004-0004-0004-0004-000000000004', 'email', 'rachel.torres@example.com', 'email_verified', true),
  'email', now(), now(), now()
)
ON CONFLICT DO NOTHING;

-- 3. Assign roles (profiles are created by trigger on auth.users insert)
-- Marcus Johnson → Account Executive
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('aaaa0001-0001-0001-0001-000000000001', '55555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

-- Lisa Park → Sales Manager
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('aaaa0002-0002-0002-0002-000000000002', '66666666-6666-6666-6666-666666666666')
ON CONFLICT DO NOTHING;

-- David Kim → Finance Reviewer
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('aaaa0003-0003-0003-0003-000000000003', '77777777-7777-7777-7777-777777777777')
ON CONFLICT DO NOTHING;

-- Rachel Torres → Contract Counsel
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('aaaa0004-0004-0004-0004-000000000004', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;
