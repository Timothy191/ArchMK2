-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Employees (linked to Supabase Auth)
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','supervisor','operator','viewer')),
  department_id UUID REFERENCES departments(id),
  accessible_departments UUID[] DEFAULT '{}',
  badge_number TEXT UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Machines
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL DEFAULT 'general',
  serial_number TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Logs (append-only)
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift TEXT NOT NULL CHECK (shift IN ('day','night')),
  supervisor_id UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (department_id, log_date, shift)
);

-- Machine Hours
CREATE TABLE machine_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fuel Logs
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  diesel_litres DECIMAL(8,2) NOT NULL CHECK (diesel_litres >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Production Logs
CREATE TABLE production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  coal_tonnes DECIMAL(10,2) NOT NULL CHECK (coal_tonnes >= 0),
  waste_tonnes DECIMAL(10,2) NOT NULL CHECK (waste_tonnes >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Backups
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  backup_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv','json','sql')),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_daily_logs_dept_date ON daily_logs(department_id, log_date DESC);
CREATE INDEX idx_machine_hours_log ON machine_hours(daily_log_id);
CREATE INDEX idx_fuel_logs_log ON fuel_logs(daily_log_id);

-- RLS Policies
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION auth.user_department_id()
RETURNS UUID AS $$
  SELECT department_id FROM employees WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.has_department_access(dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT auth.is_admin()
  OR auth.user_department_id() = dept_id
  OR dept_id = ANY(
    SELECT accessible_departments FROM employees WHERE id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Daily logs policies
CREATE POLICY department_select ON daily_logs FOR SELECT USING (auth.has_department_access(department_id));
CREATE POLICY department_insert ON daily_logs FOR INSERT WITH CHECK (auth.has_department_access(department_id));
CREATE POLICY department_update ON daily_logs FOR UPDATE USING (auth.has_department_access(department_id));

-- Machine hours policies (delegate to parent daily_log department)
CREATE POLICY machine_hours_select ON machine_hours FOR SELECT USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = machine_hours.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
CREATE POLICY machine_hours_insert ON machine_hours FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = machine_hours.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);

-- Fuel logs policies
CREATE POLICY fuel_logs_select ON fuel_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = fuel_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
CREATE POLICY fuel_logs_insert ON fuel_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = fuel_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);

-- Production logs policies
CREATE POLICY production_logs_select ON production_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = production_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
CREATE POLICY production_logs_insert ON production_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = production_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);

-- Machines policies
CREATE POLICY dept_machine_select ON machines FOR SELECT USING (auth.has_department_access(department_id));
CREATE POLICY dept_machine_insert ON machines FOR INSERT WITH CHECK (auth.has_department_access(department_id));
CREATE POLICY dept_machine_update ON machines FOR UPDATE USING (auth.has_department_access(department_id));

-- Backups policies
CREATE POLICY dept_backup_select ON backups FOR SELECT USING (auth.has_department_access(department_id));
CREATE POLICY dept_backup_insert ON backups FOR INSERT WITH CHECK (auth.has_department_access(department_id));

-- Auth trigger: auto-create employee on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employees (id, email, full_name, role, department_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta->>'role')::text, 'operator'),
    COALESCE((NEW.raw_user_meta->>'department_id')::uuid, NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
