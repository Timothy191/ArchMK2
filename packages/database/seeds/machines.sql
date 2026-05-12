INSERT INTO machines (department_id, name, machine_type, serial_number) VALUES
  ((SELECT id FROM departments WHERE name='drilling'), 'Rig A1',   'drill_rig',    'DR-001'),
  ((SELECT id FROM departments WHERE name='drilling'), 'Rig B2',   'drill_rig',    'DR-002'),
  ((SELECT id FROM departments WHERE name='production'), 'Excavator P1', 'excavator', 'EX-001'),
  ((SELECT id FROM departments WHERE name='production'), 'Truck T1',     'dump_truck','DT-001'),
  ((SELECT id FROM departments WHERE name='production'), 'Crusher C1',   'crusher',   'CR-001'),
  ((SELECT id FROM departments WHERE name='engineering'), 'Lathe L1',    'lathe',      'LA-001'),
  ((SELECT id FROM departments WHERE name='control-room'), 'PLC Unit 1', 'plc',       'PLC-001');
