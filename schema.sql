-- ═══════════════════════════════════════════════════════════
-- DocScribe v2.0 — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- ═══════════════════════════════════════════════════════════

-- Doctors (one account per clinic, MVP)
CREATE TABLE IF NOT EXISTS doctors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  clinic_name TEXT NOT NULL,
  phone       TEXT,
  mci_number  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations (one per patient visit)
CREATE TABLE IF NOT EXISTS consultations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id        UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name     TEXT NOT NULL,
  patient_phone    TEXT NOT NULL,
  patient_age      INTEGER,
  patient_gender   TEXT CHECK (patient_gender IN ('M', 'F', 'Other')),
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  raw_transcript   TEXT,
  status           TEXT DEFAULT 'recording'
                   CHECK (status IN ('recording','processing','review','complete')),
  whatsapp_sent    BOOLEAN DEFAULT FALSE,
  printed          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions (1:1 with consultation, LLM-filled context fields)
CREATE TABLE IF NOT EXISTS prescriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   UUID REFERENCES consultations(id) UNIQUE,
  chief_complaint   TEXT,
  diagnosis         TEXT,
  history_summary   TEXT,
  instructions      TEXT[],
  dietary_notes     TEXT[],
  follow_up         TEXT,
  tests_ordered     TEXT[],
  pdf_url           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Medications (many per prescription — doctor entered via drug pad)
CREATE TABLE IF NOT EXISTS medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_id         TEXT,
  display_name    TEXT NOT NULL,
  generic_name    TEXT,
  dosage          TEXT,
  frequency       TEXT,
  duration        TEXT,
  timing          TEXT,
  special_notes   TEXT,
  source          TEXT DEFAULT 'manual'
                  CHECK (source IN ('manual','speech_suggestion')),
  display_order   INTEGER DEFAULT 0
);

-- ═══════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_medications_prescription ON medications(prescription_id);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS) — doctors see only their data
-- ═══════════════════════════════════════════════════════════
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Doctors can read/write their own row
CREATE POLICY doctors_own ON doctors
  FOR ALL USING (id = auth.uid());

-- Consultations scoped to doctor
CREATE POLICY consultations_own ON consultations
  FOR ALL USING (doctor_id = auth.uid());

-- Prescriptions scoped via consultation → doctor
CREATE POLICY prescriptions_own ON prescriptions
  FOR ALL USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE doctor_id = auth.uid()
    )
  );

-- Medications scoped via prescription → consultation → doctor
CREATE POLICY medications_own ON medications
  FOR ALL USING (
    prescription_id IN (
      SELECT p.id FROM prescriptions p
      JOIN consultations c ON c.id = p.consultation_id
      WHERE c.doctor_id = auth.uid()
    )
  );
