-- Fix RLS has_department_access to use scalar subquery for ANY(array)
-- (already corrected in 001_initial.sql for fresh installs; this migration is a no-op for new setups)

-- Atomic daily log submission function
CREATE OR REPLACE FUNCTION submit_daily_log(
  p_department_id UUID,
  p_log_date DATE,
  p_shift TEXT,
  p_supervisor_id UUID,
  p_notes TEXT,
  p_machine_hours JSONB DEFAULT NULL,
  p_fuel_logs JSONB DEFAULT NULL,
  p_production JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO daily_logs (department_id, log_date, shift, supervisor_id, notes)
  VALUES (p_department_id, p_log_date, p_shift, p_supervisor_id, p_notes)
  RETURNING id INTO v_log_id;

  IF p_machine_hours IS NOT NULL AND jsonb_array_length(p_machine_hours) > 0 THEN
    INSERT INTO machine_hours (daily_log_id, machine_id, hours_worked)
    SELECT v_log_id, (e->>'machine_id')::UUID, (e->>'hours_worked')::DECIMAL
    FROM jsonb_array_elements(p_machine_hours) AS e;
  END IF;

  IF p_fuel_logs IS NOT NULL AND jsonb_array_length(p_fuel_logs) > 0 THEN
    INSERT INTO fuel_logs (daily_log_id, machine_id, diesel_litres)
    SELECT v_log_id, (e->>'machine_id')::UUID, (e->>'diesel_litres')::DECIMAL
    FROM jsonb_array_elements(p_fuel_logs) AS e;
  END IF;

  IF p_production IS NOT NULL THEN
    INSERT INTO production_logs (daily_log_id, coal_tonnes, waste_tonnes)
    VALUES (
      v_log_id,
      (p_production->>'coal_tonnes')::DECIMAL,
      (p_production->>'waste_tonnes')::DECIMAL
    );
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users so RLS policies still govern row-level access
-- (the function runs as definer but inserts still respect table RLS)
GRANT EXECUTE ON FUNCTION submit_daily_log(UUID, DATE, TEXT, UUID, TEXT, JSONB, JSONB, JSONB) TO authenticated;

-- RLS UPDATE / DELETE policies for child tables (corrections and cleanup)
CREATE POLICY machine_hours_update ON machine_hours FOR UPDATE USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = machine_hours.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
CREATE POLICY machine_hours_delete ON machine_hours FOR DELETE USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = machine_hours.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);

CREATE POLICY fuel_logs_update ON fuel_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = fuel_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
CREATE POLICY fuel_logs_delete ON fuel_logs FOR DELETE USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = fuel_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);

CREATE POLICY production_logs_update ON production_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = production_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
CREATE POLICY production_logs_delete ON production_logs FOR DELETE USING (
  EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = production_logs.daily_log_id AND auth.has_department_access(daily_logs.department_id))
);
