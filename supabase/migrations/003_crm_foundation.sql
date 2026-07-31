-- ============================================================
-- Aqar Data Studio — CRM Phase 1 Foundation
-- Local migration only. Do not run automatically.
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_customers (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  customer_type TEXT NOT NULL CHECK (customer_type IN (
    'owner', 'buyer', 'investor', 'developer', 'broker', 'company', 'custom'
  )),
  custom_type   TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  phone         TEXT,
  whatsapp      TEXT,
  email         TEXT,
  company_name  TEXT,
  job_title     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_customers_name
  ON crm_customers USING GIN(to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(company_name, '')));
CREATE INDEX IF NOT EXISTS idx_crm_customers_type ON crm_customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_crm_customers_status ON crm_customers(status);
CREATE INDEX IF NOT EXISTS idx_crm_customers_created_at ON crm_customers(created_at DESC);

DROP TRIGGER IF EXISTS trg_crm_customers_updated_at ON crm_customers;
CREATE TRIGGER trg_crm_customers_updated_at
  BEFORE UPDATE ON crm_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS crm_tags (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#567C8D',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_tags_name_lower
  ON crm_tags (lower(name));

DROP TRIGGER IF EXISTS trg_crm_tags_updated_at ON crm_tags;
CREATE TRIGGER trg_crm_tags_updated_at
  BEFORE UPDATE ON crm_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS crm_customer_tags (
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  tag_id      TEXT NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_customer_tags_tag_id
  ON crm_customer_tags(tag_id);

-- Foundation for future customer/property relationship features.
-- Phase 1 deliberately does not expose relationship workflows in the UI.
CREATE TABLE IF NOT EXISTS crm_customer_property_links (
  id                 TEXT PRIMARY KEY,
  customer_id        TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  property_id        TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  relationship_type  TEXT NOT NULL DEFAULT 'interest',
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, property_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_customer_property_links_customer
  ON crm_customer_property_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_customer_property_links_property
  ON crm_customer_property_links(property_id);

ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_customer_property_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read CRM customers"
  ON crm_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read CRM tags"
  ON crm_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read CRM customer tags"
  ON crm_customer_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read CRM property links"
  ON crm_customer_property_links FOR SELECT TO authenticated USING (true);

-- Writes are performed by the Express API with the service-role client,
-- after session and role validation.