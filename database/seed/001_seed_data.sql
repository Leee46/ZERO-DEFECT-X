-- ZeroDefect X — PostgreSQL Seed Data
-- Controlled demonstration dataset for initial application seeding

INSERT INTO machines (machine_id, name, status, location, baseline_temp, baseline_vibration, baseline_pressure)
VALUES
('M01', 'Precision Milling Unit 01', 'NORMAL', 'Bay A - Line 1', 65.00, 2.00, 6.00),
('M02', 'CNC Lathe Station 02', 'NORMAL', 'Bay A - Line 2', 67.00, 2.10, 6.00),
('M03', 'High-Velocity Stamping Press 03', 'WARNING', 'Bay B - Line 1', 68.00, 2.10, 6.20),
('M04', 'Automated Assembly Station 04', 'NORMAL', 'Bay B - Line 2', 63.00, 1.80, 6.00)
ON CONFLICT (machine_id) DO NOTHING;

INSERT INTO batches (batch_id, product_sku, machine_id, shift_name, target_quantity, produced_quantity, defect_count, status)
VALUES
('B1042', 'P1042-087', 'M03', 'Shift B', 500, 310, 27, 'FLAGGED'),
('B1041', 'P1041-012', 'M02', 'Shift A', 400, 380, 6, 'ACTIVE'),
('B1040', 'P1040-001', 'M01', 'Shift A', 500, 500, 4, 'COMPLETED')
ON CONFLICT (batch_id) DO NOTHING;
