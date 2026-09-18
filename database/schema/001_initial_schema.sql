-- ZeroDefect X — PostgreSQL Initial Database Schema
-- Defines tables for products, inspections, defects, machines, parameters, batches, shifts, root cause, risk, alerts, corrective actions, & reinspections.

CREATE TABLE IF NOT EXISTS machines (
    machine_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    location VARCHAR(100) NOT NULL,
    baseline_temp NUMERIC(5,2) NOT NULL DEFAULT 65.0,
    baseline_vibration NUMERIC(5,2) NOT NULL DEFAULT 2.0,
    baseline_pressure NUMERIC(5,2) NOT NULL DEFAULT 6.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
    batch_id VARCHAR(20) PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL,
    machine_id VARCHAR(10) REFERENCES machines(machine_id),
    shift_name VARCHAR(20) NOT NULL,
    target_quantity INT NOT NULL,
    produced_quantity INT NOT NULL DEFAULT 0,
    defect_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspections (
    inspection_id VARCHAR(30) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(20) REFERENCES batches(batch_id),
    machine_id VARCHAR(10) REFERENCES machines(machine_id),
    shift_name VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASS', 'DEFECTIVE')),
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS defects (
    defect_id VARCHAR(30) PRIMARY KEY,
    inspection_id VARCHAR(30) REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    defect_type VARCHAR(50) NOT NULL,
    confidence NUMERIC(5,2) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    location VARCHAR(100) NOT NULL,
    bounding_box JSONB,
    description TEXT
);

CREATE TABLE IF NOT EXISTS machine_parameters (
    parameter_id SERIAL PRIMARY KEY,
    inspection_id VARCHAR(30) REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    machine_id VARCHAR(10) REFERENCES machines(machine_id),
    temperature NUMERIC(5,2) NOT NULL,
    vibration NUMERIC(5,2) NOT NULL,
    pressure NUMERIC(5,2) NOT NULL,
    speed INT NOT NULL,
    env_temp NUMERIC(5,2) NOT NULL,
    env_humidity INT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS root_cause_analysis (
    analysis_id SERIAL PRIMARY KEY,
    inspection_id VARCHAR(30) REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    probable_factor TEXT NOT NULL,
    evidence_score INT NOT NULL,
    factors_json JSONB NOT NULL,
    evidence_points JSONB NOT NULL,
    disclaimer TEXT NOT NULL,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    assessment_id SERIAL PRIMARY KEY,
    machine_id VARCHAR(10) REFERENCES machines(machine_id),
    risk_level VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    signals JSONB NOT NULL,
    trend VARCHAR(20) NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(30) PRIMARY KEY,
    machine_id VARCHAR(10) REFERENCES machines(machine_id),
    inspection_id VARCHAR(30) REFERENCES inspections(inspection_id),
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corrective_actions (
    action_id VARCHAR(30) PRIMARY KEY,
    inspection_id VARCHAR(30) REFERENCES inspections(inspection_id),
    machine_id VARCHAR(10) REFERENCES machines(machine_id),
    batch_id VARCHAR(20) REFERENCES batches(batch_id),
    defect_type VARCHAR(50) NOT NULL,
    recommended_actions JSONB NOT NULL,
    actual_action_taken TEXT,
    operator VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS reinspections (
    reinspection_id VARCHAR(30) PRIMARY KEY,
    action_id VARCHAR(30) REFERENCES corrective_actions(action_id),
    before_defect_rate NUMERIC(5,2) NOT NULL,
    after_defect_rate NUMERIC(5,2) NOT NULL,
    verification_status VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
