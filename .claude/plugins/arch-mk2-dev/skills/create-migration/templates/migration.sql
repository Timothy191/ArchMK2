-- NNN_description.sql
-- Created: YYYY-MM-DD
-- Purpose: <one-line summary of the change>

-- ============================================================================
-- Up Migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.<table_name> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns here
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: required for new tables per .claude/rules/auth.md
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- Default-deny policy: explicit grants to authenticated role
CREATE POLICY "<table_name>_select_authenticated"
  ON public.<table_name>
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for common query patterns (add as needed)
-- CREATE INDEX <table_name>_created_at_idx ON public.<table_name> (created_at DESC);

-- ============================================================================
-- Down Migration (manual; Supabase does not auto-rollback)
-- ============================================================================
-- DROP POLICY IF EXISTS "<table_name>_select_authenticated" ON public.<table_name>;
-- DROP TABLE IF EXISTS public.<table_name>;
