-- Release 1 E2E fixtures for the isolated local database (scripts/e2e-local.sh).
-- All accounts use the password: E2e-pass-123!
-- NEVER run against production.
BEGIN;

\set pw '$2a$10$Gd18cIzEYZ3TDIg67I1F1eYJ3KvCIOe4x2EtTSmT7dPvATj9NklsO'

INSERT INTO users (id, email, password_hash, name, role, is_admin, country, locale, email_verified_at) VALUES
  ('00000000-0000-4000-a000-000000000001', 'cust-au@e2e.test',   :'pw', 'Mei Chen',      'customer', false, 'AU', 'zh', NOW()),
  ('00000000-0000-4000-a000-000000000002', 'cust-ca@e2e.test',   :'pw', 'Wei Zhang',     'customer', false, 'CA', 'zh', NOW()),
  ('00000000-0000-4000-a000-000000000003', 'cust-bad@e2e.test',  :'pw', 'Paused Customer','customer', false, 'AU', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000004', 'cust-hist@e2e.test', :'pw', 'History Customer','customer', false, 'AU', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000011', 'prov-good@e2e.test', :'pw', 'Good Helper',   'provider', false, 'AU', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000012', 'prov-nocheck@e2e.test', :'pw', 'No Check Helper', 'provider', false, 'AU', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000013', 'prov-low@e2e.test',  :'pw', 'Low Rated Helper', 'provider', false, 'AU', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000014', 'prov-ca@e2e.test',   :'pw', 'Vancouver Helper', 'provider', false, 'CA', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000015', 'prov-standby@e2e.test', :'pw', 'Standby Helper', 'provider', false, 'AU', 'en', NOW()),
  ('00000000-0000-4000-a000-000000000021', 'admin@e2e.test',     :'pw', 'E2E Admin',     'customer', true,  'AU', 'en', NOW());

INSERT INTO addresses (id, user_id, label, line1, city, state, postcode, country, is_default) VALUES
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'Home',     '1 Station St',  'Box Hill',  'VIC', '3128',    'AU', true),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'Daughter', '5 Victoria Ave','Chatswood', 'NSW', '2067',    'AU', false),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000002', 'Home',     '8 No. 3 Rd',    'Richmond',  'BC',  'V6X 1A1', 'CA', true),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000003', 'Home',     '2 Kew Rd',      'Kew',       'VIC', '3101',    'AU', true),
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000004', 'Home',     '9 Doncaster Rd','Doncaster', 'VIC', '3108',    'AU', true);

INSERT INTO provider_profiles (id, user_id, service_radius_km, onboarding_status) VALUES
  ('00000000-0000-4000-c000-000000000011', '00000000-0000-4000-a000-000000000011', 25, 'approved'),
  ('00000000-0000-4000-c000-000000000012', '00000000-0000-4000-a000-000000000012', 25, 'approved'),
  ('00000000-0000-4000-c000-000000000013', '00000000-0000-4000-a000-000000000013', 25, 'approved'),
  ('00000000-0000-4000-c000-000000000014', '00000000-0000-4000-a000-000000000014', 25, 'approved'),
  ('00000000-0000-4000-c000-000000000015', '00000000-0000-4000-a000-000000000015', 25, 'approved');
UPDATE provider_profiles SET emergency_opt_in = true WHERE id = '00000000-0000-4000-c000-000000000015';

INSERT INTO provider_categories (provider_id, category) VALUES
  ('00000000-0000-4000-c000-000000000011', 'cleaning'),
  ('00000000-0000-4000-c000-000000000011', 'garden'),
  ('00000000-0000-4000-c000-000000000011', 'repair'),
  ('00000000-0000-4000-c000-000000000012', 'cleaning'),
  ('00000000-0000-4000-c000-000000000013', 'cleaning'),
  ('00000000-0000-4000-c000-000000000014', 'cleaning'),
  ('00000000-0000-4000-c000-000000000015', 'cleaning'),
  ('00000000-0000-4000-c000-000000000015', 'garden'),
  ('00000000-0000-4000-c000-000000000015', 'repair');

-- Background checks: good + low + ca have current police check & ID; nocheck has none.
INSERT INTO provider_documents (provider_id, type, file_url, status, expires_at, reviewed_at) VALUES
  ('00000000-0000-4000-c000-000000000011', 'police_check', 'https://e2e.test/pc1.pdf', 'approved', NOW() + INTERVAL '2 years', NOW()),
  ('00000000-0000-4000-c000-000000000011', 'identity',     'https://e2e.test/id1.pdf', 'approved', NOW() + INTERVAL '5 years', NOW()),
  ('00000000-0000-4000-c000-000000000013', 'police_check', 'https://e2e.test/pc3.pdf', 'approved', NOW() + INTERVAL '2 years', NOW()),
  ('00000000-0000-4000-c000-000000000013', 'identity',     'https://e2e.test/id3.pdf', 'approved', NOW() + INTERVAL '5 years', NOW()),
  ('00000000-0000-4000-c000-000000000014', 'police_check', 'https://e2e.test/pc4.pdf', 'approved', NULL, NOW()),
  ('00000000-0000-4000-c000-000000000014', 'identity',     'https://e2e.test/id4.pdf', 'approved', NOW() + INTERVAL '5 years', NOW()),
  ('00000000-0000-4000-c000-000000000015', 'police_check', 'https://e2e.test/pc5.pdf', 'approved', NOW() + INTERVAL '2 years', NOW()),
  ('00000000-0000-4000-c000-000000000015', 'identity',     'https://e2e.test/id5.pdf', 'approved', NOW() + INTERVAL '5 years', NOW());

-- History: 3 released jobs. prov-low got 2★ from cust-hist (→ paused provider);
-- cust-bad got 1★ from prov-good (→ paused customer).
INSERT INTO bookings (id, customer_id, provider_id, service_id, address_id, scheduled_at, duration_min, status, base_price, tax_amount, total_price, currency, effort_tier, started_at, completed_at)
SELECT gen_random_uuid(), c.cust, c.prov, s.id, c.addr, NOW() - (g || ' days')::interval, 120, 'released', 110, 11, 121, 'AUD', 'regular',
       NOW() - (g || ' days')::interval, NOW() - (g || ' days')::interval + INTERVAL '2 hours'
FROM services s,
     (VALUES ('00000000-0000-4000-a000-000000000004'::uuid, '00000000-0000-4000-c000-000000000013'::uuid, '00000000-0000-4000-b000-000000000005'::uuid),
             ('00000000-0000-4000-a000-000000000003'::uuid, '00000000-0000-4000-c000-000000000011'::uuid, '00000000-0000-4000-b000-000000000004'::uuid)) AS c(cust, prov, addr),
     generate_series(10, 12) g
WHERE s.code = 'cleaning_basic_2h';

INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment, direction)
SELECT b.id, b.customer_id, b.provider_id,
       CASE WHEN b.provider_id = '00000000-0000-4000-c000-000000000013' THEN 2 ELSE 1 END,
       'E2E history',
       CASE WHEN b.provider_id = '00000000-0000-4000-c000-000000000013' THEN 'customer_to_provider' ELSE 'provider_to_customer' END
FROM bookings b WHERE b.status = 'released';

COMMIT;
