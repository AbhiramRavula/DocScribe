// ─── Drug Database Types ───────────────────────────────────────

export interface DrugEntry {
  id: string;
  brand_names: string[];
  generic_name: string;
  forms: string[];
  standard_dosages: string[];
  standard_frequencies: string[];
  common_durations: string[];
  category: string;
  common_for: string[];
}

// ─── Medication (doctor-selected, goes on the prescription) ───

export type MedicationSource = 'manual' | 'speech_suggestion';

export interface Medication {
  id: string;
  drug_id: string | null;
  display_name: string;
  generic_name: string | null;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string | null; // AC / PC / null
  special_notes: string | null;
  source: MedicationSource;
  display_order: number;
}

// ─── LLM Extraction Output ────────────────────────────────────

export interface MentionedDrug {
  name: string;
  context: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedContext {
  chief_complaint: string | null;
  diagnosis: string | null;
  history_summary: string | null;
  examination_notes: string | null;
  instructions: string[];
  dietary_notes: string[];
  follow_up: string | null;
  tests_ordered: string[];
  mentioned_drugs: MentionedDrug[];
}

// ─── Consultation Status ──────────────────────────────────────

export type ConsultationStatus = 'recording' | 'processing' | 'review' | 'complete';

// ─── Patient Info ─────────────────────────────────────────────

export type PatientGender = 'M' | 'F' | 'Other';

export interface PatientInfo {
  name: string;
  phone: string;
  age: number | null;
  gender: PatientGender | null;
}

// ─── Consultation (DB row) ────────────────────────────────────

export interface Consultation {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  patient_gender: PatientGender | null;
  started_at: string;
  ended_at: string | null;
  raw_transcript: string | null;
  status: ConsultationStatus;
  whatsapp_sent: boolean;
  printed: boolean;
  created_at: string;
}

// ─── Prescription (DB row) ────────────────────────────────────

export interface Prescription {
  id: string;
  consultation_id: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  history_summary: string | null;
  instructions: string[];
  dietary_notes: string[];
  follow_up: string | null;
  tests_ordered: string[];
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Doctor Profile ───────────────────────────────────────────

export interface Doctor {
  id: string;
  email: string;
  full_name: string;
  clinic_name: string;
  phone: string | null;
  mci_number: string | null;
  created_at: string;
}

// ─── Drug Search Result (what DrugSearchInput returns) ────────

export interface DrugSearchResult {
  item: DrugEntry;
  score: number;
}
