-- ============================================================
-- Aqar Data Studio — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── REGIONS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default regions
INSERT INTO regions (id, name, active) VALUES
  ('shorouk',     'مدينة الشروق',              true),
  ('madinaty',    'مدينتي',                    true),
  ('badr',        'مدينة بدر',                 true),
  ('wasal',       'كمباوند وصال',              true),
  ('tagamoa',     'التجمع',                    true),
  ('beit_elwatan','بيت الوطن',                 true),
  ('rehab',       'الرحاب',                    true),
  ('new_capital', 'العاصمة الإدارية الجديدة',  true),
  ('nasr_city',   'مدينة نصر',                 true),
  ('mohandeseen', 'المهندسين',                 true),
  ('sheikh_zayed','الشيخ زايد',                true),
  ('oct6',        '6 أكتوبر',                  true)
ON CONFLICT (id) DO NOTHING;

-- ─── PROPERTY TYPES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_types (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO property_types (id, name, active) VALUES
  ('apartment',     'شقة',          true),
  ('duplex',        'دوبلكس',        true),
  ('villa',         'فيلا',          true),
  ('penthouse',     'بنت هاوس',      true),
  ('townhouse',     'تاون هاوس',     true),
  ('twinhouse',     'توين هاوس',     true),
  ('studio',        'أستوديو',       true),
  ('shop',          'محل',           true),
  ('office',        'مكتب إداري',    true),
  ('clinic',        'عيادة',         true),
  ('medical_center','مركز طبي',      true),
  ('restaurant',    'مطعم',          true),
  ('cafe',          'كافيه',         true),
  ('land',          'أرض',           true),
  ('pharmacy',      'صيدلية',        true),
  ('building',      'عمارة',         true)
ON CONFLICT (id) DO NOTHING;

-- ─── LOOKUP OPTIONS (dynamic values) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lookup_options (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL,         -- e.g. 'finishing', 'category', 'status', 'unit_type'
  value       TEXT NOT NULL,
  label       TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lookup_options_category ON lookup_options(category);

-- Finishing options
INSERT INTO lookup_options (id, category, value, label, sort_order) VALUES
  ('fin_1', 'finishing', 'سوبر لوكس',       'سوبر لوكس',       1),
  ('fin_2', 'finishing', 'ألترا سوبر لوكس', 'ألترا سوبر لوكس', 2),
  ('fin_3', 'finishing', 'متشطب',           'متشطب',           3),
  ('fin_4', 'finishing', 'نص تشطيب',        'نص تشطيب',        4),
  ('fin_5', 'finishing', 'تشطيب 75%',       'تشطيب 75%',       5),
  ('fin_6', 'finishing', 'تشطيب 50%',       'تشطيب 50%',       6),
  ('fin_7', 'finishing', 'طوب أحمر',        'طوب أحمر',        7),
  ('fin_8', 'finishing', 'تحت الإنشاء',     'تحت الإنشاء',     8)
ON CONFLICT (id) DO NOTHING;

-- Category options
INSERT INTO lookup_options (id, category, value, label, sort_order) VALUES
  ('cat_1', 'category', 'sale',           'للبيع',     1),
  ('cat_2', 'category', 'rent',           'للإيجار',   2),
  ('cat_3', 'category', 'furnished',      'مفروش',     3),
  ('cat_4', 'category', 'administrative', 'إداري',     4),
  ('cat_5', 'category', 'medical',        'طبي',       5),
  ('cat_6', 'category', 'commercial',     'تجاري',     6)
ON CONFLICT (id) DO NOTHING;

-- Status options
INSERT INTO lookup_options (id, category, value, label, sort_order) VALUES
  ('sta_1', 'status', 'active',   'نشط',    1),
  ('sta_2', 'status', 'listed',   'معروض',  2),
  ('sta_3', 'status', 'draft',    'مسودة',  3),
  ('sta_4', 'status', 'sold',     'مباعة',  4),
  ('sta_5', 'status', 'rented',   'مؤجر',   5),
  ('sta_6', 'status', 'reserved', 'محجوز',  6)
ON CONFLICT (id) DO NOTHING;

-- ─── PROPERTIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  price            BIGINT NOT NULL DEFAULT 0,
  area             INTEGER NOT NULL DEFAULT 0,
  beds             INTEGER NOT NULL DEFAULT 0,
  baths            INTEGER NOT NULL DEFAULT 0,
  floors           INTEGER NOT NULL DEFAULT 0,
  floor            INTEGER NOT NULL DEFAULT 0,
  finishing        TEXT NOT NULL DEFAULT '',
  view             TEXT NOT NULL DEFAULT '',
  type_id          TEXT REFERENCES property_types(id),
  region_id        TEXT REFERENCES regions(id),
  category         TEXT NOT NULL DEFAULT 'sale',
  status           TEXT NOT NULL DEFAULT 'active',
  featured         BOOLEAN NOT NULL DEFAULT false,
  agent_type       TEXT NOT NULL DEFAULT 'direct',
  images           JSONB NOT NULL DEFAULT '[]',
  video_url        TEXT NOT NULL DEFAULT '',
  external_url     TEXT NOT NULL DEFAULT '',
  maps_url         TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  unit_type        TEXT NOT NULL DEFAULT '',
  sub_area         TEXT NOT NULL DEFAULT '',
  layout           TEXT NOT NULL DEFAULT '',
  master           TEXT NOT NULL DEFAULT '',
  elevator         TEXT NOT NULL DEFAULT '',
  floor_text       TEXT NOT NULL DEFAULT '',
  location         TEXT NOT NULL DEFAULT '',
  source           TEXT NOT NULL DEFAULT '',
  source_phones    JSONB NOT NULL DEFAULT '[]',
  source_email     TEXT NOT NULL DEFAULT '',
  source_location  TEXT NOT NULL DEFAULT '',
  source_notes     TEXT NOT NULL DEFAULT '',
  views            INTEGER NOT NULL DEFAULT 0,
  cover_priority   TEXT NOT NULL DEFAULT 'image',
  tags             JSONB NOT NULL DEFAULT '[]',
  notes            TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_code         ON properties(code);
CREATE INDEX IF NOT EXISTS idx_properties_region_id    ON properties(region_id);
CREATE INDEX IF NOT EXISTS idx_properties_type_id      ON properties(type_id);
CREATE INDEX IF NOT EXISTS idx_properties_category     ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_status       ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured     ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_created_at   ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_price        ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_area         ON properties(area);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_fts
  ON properties USING GIN(to_tsvector('arabic', coalesce(title,'') || ' ' || coalesce(code,'') || ' ' || coalesce(sub_area,'')));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── PROPERTY HISTORY ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_history (
  id          TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  snapshot    JSONB,
  diff        JSONB,
  changed_by  TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history(property_id);

-- ─── USER PROFILES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  role       TEXT NOT NULL DEFAULT 'viewer',   -- admin | agent | viewer
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id             TEXT PRIMARY KEY,
  action         TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    TEXT,
  resource_label TEXT,
  user_id        TEXT,
  user_name      TEXT,
  ip_address     TEXT,
  before_data    JSONB,
  after_data     JSONB,
  meta           JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource    ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON audit_logs(user_id);

-- ─── SETTINGS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                         TEXT PRIMARY KEY DEFAULT 'default',
  company_name               TEXT DEFAULT 'Aqar Data Studio',
  company_logo               TEXT,
  default_region_id          TEXT REFERENCES regions(id),
  default_category           TEXT DEFAULT 'sale',
  default_status             TEXT DEFAULT 'active',
  currency                   TEXT DEFAULT 'EGP',
  language                   TEXT DEFAULT 'ar',
  date_format                TEXT DEFAULT 'DD/MM/YYYY',
  public_listings_enabled    BOOLEAN DEFAULT true,
  require_auth_for_listings  BOOLEAN DEFAULT false,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE regions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookup_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings        ENABLE ROW LEVEL SECURITY;

-- Read-only public access to reference tables and active properties
CREATE POLICY "Public read regions"        ON regions        FOR SELECT USING (active = true);
CREATE POLICY "Public read property_types" ON property_types FOR SELECT USING (active = true);
CREATE POLICY "Public read lookup_options" ON lookup_options FOR SELECT USING (active = true);
CREATE POLICY "Public read active props"   ON properties     FOR SELECT USING (status = 'active');

-- Authenticated users (all roles) can read everything
CREATE POLICY "Auth read regions"        ON regions        FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read property_types" ON property_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read lookup_options" ON lookup_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read properties"     ON properties     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read history"        ON property_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read audit"          ON audit_logs     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read settings"       ON settings       FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read profiles"       ON user_profiles  FOR SELECT TO authenticated USING (true);

-- Note: Write operations go through the API server (service role key bypasses RLS)
-- The service role key is used server-side only and is never exposed to the browser.

-- ─── VIEWS ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW property_summary AS
SELECT
  p.id,
  p.code,
  p.title,
  p.price,
  p.area,
  p.beds,
  p.baths,
  p.finishing,
  p.category,
  p.status,
  p.featured,
  p.created_at,
  r.name  AS region_name,
  pt.name AS type_name,
  p.sub_area,
  p.floor_text,
  p.unit_type
FROM properties p
LEFT JOIN regions r        ON r.id = p.region_id
LEFT JOIN property_types pt ON pt.id = p.type_id;
