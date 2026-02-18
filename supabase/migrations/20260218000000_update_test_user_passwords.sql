-- Update test user passwords to '1testLOGin1' and emails to @testco.com

-- Marcus Johnson
UPDATE auth.users
SET encrypted_password = '$2b$10$lhsAgn7hoxHEnnVbvqPUwuX/SofU0.I.PcwEDHsyBGuuZcLRGOTLG',
    email = 'marcus.johnson@testco.com',
    raw_user_meta_data = raw_user_meta_data || '{"email":"marcus.johnson@testco.com"}'::jsonb
WHERE id = 'aaaa0001-0001-0001-0001-000000000001';

UPDATE auth.identities
SET provider_id = 'marcus.johnson@testco.com',
    identity_data = identity_data || '{"email":"marcus.johnson@testco.com"}'::jsonb
WHERE user_id = 'aaaa0001-0001-0001-0001-000000000001' AND provider = 'email';

-- Lisa Park
UPDATE auth.users
SET encrypted_password = '$2b$10$lhsAgn7hoxHEnnVbvqPUwuX/SofU0.I.PcwEDHsyBGuuZcLRGOTLG',
    email = 'lisa.park@testco.com',
    raw_user_meta_data = raw_user_meta_data || '{"email":"lisa.park@testco.com"}'::jsonb
WHERE id = 'aaaa0002-0002-0002-0002-000000000002';

UPDATE auth.identities
SET provider_id = 'lisa.park@testco.com',
    identity_data = identity_data || '{"email":"lisa.park@testco.com"}'::jsonb
WHERE user_id = 'aaaa0002-0002-0002-0002-000000000002' AND provider = 'email';

-- David Kim
UPDATE auth.users
SET encrypted_password = '$2b$10$lhsAgn7hoxHEnnVbvqPUwuX/SofU0.I.PcwEDHsyBGuuZcLRGOTLG',
    email = 'david.kim@testco.com',
    raw_user_meta_data = raw_user_meta_data || '{"email":"david.kim@testco.com"}'::jsonb
WHERE id = 'aaaa0003-0003-0003-0003-000000000003';

UPDATE auth.identities
SET provider_id = 'david.kim@testco.com',
    identity_data = identity_data || '{"email":"david.kim@testco.com"}'::jsonb
WHERE user_id = 'aaaa0003-0003-0003-0003-000000000003' AND provider = 'email';

-- Rachel Torres
UPDATE auth.users
SET encrypted_password = '$2b$10$lhsAgn7hoxHEnnVbvqPUwuX/SofU0.I.PcwEDHsyBGuuZcLRGOTLG',
    email = 'rachel.torres@testco.com',
    raw_user_meta_data = raw_user_meta_data || '{"email":"rachel.torres@testco.com"}'::jsonb
WHERE id = 'aaaa0004-0004-0004-0004-000000000004';

UPDATE auth.identities
SET provider_id = 'rachel.torres@testco.com',
    identity_data = identity_data || '{"email":"rachel.torres@testco.com"}'::jsonb
WHERE user_id = 'aaaa0004-0004-0004-0004-000000000004' AND provider = 'email';
