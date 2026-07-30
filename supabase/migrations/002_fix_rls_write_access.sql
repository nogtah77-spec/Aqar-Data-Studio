-- ============================================================
-- Fix: Explicit write-access RLS policies for API server
-- Run this in your Supabase SQL Editor if write operations
-- (create/update/delete) fail with "violates row-level security policy"
-- ============================================================

-- ─── REGIONS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Service role write regions"
  ON regions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── PROPERTY TYPES ───────────────────────────────────────────────────────────
CREATE POLICY "Service role write property_types"
  ON property_types
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── LOOKUP OPTIONS ───────────────────────────────────────────────────────────
CREATE POLICY "Service role write lookup_options"
  ON lookup_options
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── PROPERTIES ───────────────────────────────────────────────────────────────
CREATE POLICY "Service role write properties"
  ON properties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── PROPERTY HISTORY ─────────────────────────────────────────────────────────
CREATE POLICY "Service role write property_history"
  ON property_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
CREATE POLICY "Service role write audit_logs"
  ON audit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── SETTINGS ─────────────────────────────────────────────────────────────────
CREATE POLICY "Service role write settings"
  ON settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── USER PROFILES ────────────────────────────────────────────────────────────
CREATE POLICY "Service role write user_profiles"
  ON user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed: view options and unit_type options
-- (Run alongside the RLS fix above)
-- ============================================================

INSERT INTO lookup_options (id, category, value, label, active, sort_order) VALUES
  ('view_1', 'view', 'بحري',   'بحري',   true, 1),
  ('view_2', 'view', 'قبلي',   'قبلي',   true, 2),
  ('view_3', 'view', 'حديقة',  'حديقة',  true, 3),
  ('view_4', 'view', 'شارع',   'شارع',   true, 4),
  ('view_5', 'view', 'ركن',    'ركن',    true, 5),
  ('view_6', 'view', 'داخلي',  'داخلي',  true, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lookup_options (id, category, value, label, active, sort_order) VALUES
  ('ut_1', 'unit_type', 'أرضي',   'أرضي',   true, 1),
  ('ut_2', 'unit_type', 'متكرر',  'متكرر',  true, 2),
  ('ut_3', 'unit_type', 'أخير',   'أخير',   true, 3),
  ('ut_4', 'unit_type', 'روف',    'روف',    true, 4),
  ('ut_5', 'unit_type', 'دوبلكس', 'دوبلكس', true, 5)
ON CONFLICT (id) DO NOTHING;
