-- Migration 0011: Seed service catalog and fix schema
-- Seeds 6 categories, 48 services with multi-country pricing

INSERT INTO service_categories (slug, name_en, name_zh, icon, sort_order) VALUES
('domestic', 'Domestic & Cleaning', '家政清洁', '🧹', 1),
('garden', 'Garden & Outdoor', '花园户外', '🌳', 2),
('repair', 'Repairs & Maintenance', '维修保养', '🔧', 3),
('personal', 'Personal Care', '个人护理', '💊', 4),
('companion', 'Companionship', '陪伴服务', '👋', 5),
('transport', 'Transport & Errands', '交通出行', '🚗', 6)
ON CONFLICT (slug) DO NOTHING;
