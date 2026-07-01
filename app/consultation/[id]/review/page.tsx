'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Printer,
  MessageCircle,
  Download,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  FileSearch,
  AlertCircle,
} from 'lucide-react';
import DrugSearchInput from '@/components/prescription-pad/DrugSearchInput';
import DrugEntryCard from '@/components/prescription-pad/DrugEntryCard';
import MedicationList from '@/components/prescription-pad/MedicationList';
import { extractContext } from '@/lib/gemini';
import { generatePrescriptionPDF, downloadPDF } from '@/lib/pdf';
import { sendWhatsApp } from '@/lib/whatsapp';
import { formatDate } from '@/lib/utils';
import type { Medication, DrugEntry, ExtractedContext, Doctor, PatientInfo, Prescription } from '@/types';

interface ReviewData {
  transcript: string;
  medications: Medication[];
  consultationData: {
    patient_name: string;
    patient_phone: string;
    patient_age: number | null;
    patient_gender: string | null;
    doctor: {
      id: string;
      full_name: string;
      clinic_name: string;
    };
  };
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: consultationId } = use(params);
  const router = useRouter();

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionDone, setExtractionDone] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Editable prescription fields
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [testsOrdered, setTestsOrdered] = useState<string[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newInstruction, setNewInstruction] = useState('');
  const [newTest, setNewTest] = useState('');

  // Drug pad
  const [showDrugPad, setShowDrugPad] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugEntry | null>(null);

  // Delivery states
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load review data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`review-${consultationId}`);
    if (stored) {
      const data: ReviewData = JSON.parse(stored);
      setReviewData(data);
      setMedications(data.medications || []);
    }
  }, [consultationId]);

  // Extract context from transcript via Gemini
  useEffect(() => {
    if (!reviewData?.transcript || extractionDone) return;

    async function extract() {
      setIsExtracting(true);
      setExtractionError(null);
      try {
        const context: ExtractedContext = await extractContext(reviewData!.transcript);

        setDiagnosis(context.diagnosis || '');
        setChiefComplaint(context.chief_complaint || '');
        setInstructions(context.instructions || []);
        setFollowUp(context.follow_up || '');
        setTestsOrdered(context.tests_ordered || []);

        setExtractionDone(true);
      } catch (err) {
        console.error('Extraction failed:', err);
        setExtractionError('Could not extract context. You can fill in the fields manually.');
        setExtractionDone(true);
      } finally {
        setIsExtracting(false);
      }
    }

    extract();
  }, [reviewData, extractionDone]);

  const buildPDFData = () => {
    if (!reviewData) return null;

    const doctor: Doctor = {
      id: reviewData.consultationData.doctor.id,
      email: '',
      full_name: reviewData.consultationData.doctor.full_name,
      clinic_name: reviewData.consultationData.doctor.clinic_name,
      phone: null,
      mci_number: null,
      created_at: '',
    };

    const patient: PatientInfo = {
      name: reviewData.consultationData.patient_name,
      phone: reviewData.consultationData.patient_phone,
      age: reviewData.consultationData.patient_age,
      gender: reviewData.consultationData.patient_gender as PatientInfo['gender'],
    };

    const prescription: Prescription = {
      id: consultationId,
      consultation_id: consultationId,
      chief_complaint: chiefComplaint || null,
      diagnosis: diagnosis || null,
      history_summary: null,
      instructions,
      dietary_notes: [],
      follow_up: followUp || null,
      tests_ordered: testsOrdered,
      pdf_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { doctor, patient, prescription, medications, date: formatDate(new Date()) };
  };

  const handleDownloadPDF = async () => {
    const data = buildPDFData();
    if (!data) return;
    setIsDownloading(true);
    try {
      const blob = generatePrescriptionPDF(data);
      downloadPDF(blob, 'Rx_' + data.patient.name.replace(/\s/g, '_') + '_' + formatDate(new Date()) + '.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setIsDownloading(false);
  };

  const handleSendWhatsApp = async () => {
    if (!reviewData) return;
    setIsSendingWhatsApp(true);
    try {
      const result = await sendWhatsApp(
        reviewData.consultationData.patient_phone,
        reviewData.consultationData.patient_name,
        '',
        reviewData.consultationData.doctor.full_name,
      );
      if (result.success) {
        sessionStorage.setItem(`whatsapp-${consultationId}`, 'sent');
      }
    } catch (err) {
      console.error('WhatsApp send error:', err);
    }
    setIsSendingWhatsApp(false);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const data = buildPDFData();
      if (data) {
        const blob = generatePrescriptionPDF(data);
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
      sessionStorage.setItem(`printed-${consultationId}`, 'true');
    } catch (err) {
      console.error('Print error:', err);
    }
    setIsPrinting(false);
  };

  const handleComplete = () => {
    sessionStorage.setItem(
      `complete-${consultationId}`,
      JSON.stringify({
        patientName: reviewData?.consultationData.patient_name,
        whatsappSent: sessionStorage.getItem(`whatsapp-${consultationId}`) === 'sent',
        printed: sessionStorage.getItem(`printed-${consultationId}`) === 'true',
      }),
    );
    router.push(`/consultation/${consultationId}/complete`);
  };

  if (!reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-6 sm:p-8 text-center max-w-sm w-full">
          <AlertCircle size={48} className="mx-auto text-warning-500 mb-4" />
          <h2 className="text-lg font-bold mb-2">No Review Data</h2>
          <p className="text-sm text-surface-500 mb-4">Start a consultation first.</p>
          <button onClick={() => router.push('/')} className="btn-primary">Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 sm:pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FileSearch size={20} className="text-primary-600 shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-surface-800 truncate">
              Prescription Review
            </h1>
            <span className="text-surface-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-surface-700 truncate hidden sm:inline">
              {reviewData.consultationData.patient_name}
            </span>
          </div>
          {isExtracting && (
            <div className="flex items-center gap-2 text-sm text-primary-600 shrink-0">
              <Loader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Extracting context...</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Extraction error */}
        {extractionError && (
          <div className="p-3 rounded-xl bg-warning-50 border border-warning-500/20 text-sm text-surface-700">
            {extractionError}
          </div>
        )}

        {/* Diagnosis */}
        <section className="glass-card-solid p-4 sm:p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-surface-700 uppercase tracking-wider">
              Diagnosis
            </h2>
            <button
              onClick={() => setEditingField(editingField === 'diagnosis' ? null : 'diagnosis')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          {editingField === 'diagnosis' ? (
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="input"
              placeholder="Enter diagnosis..."
              autoFocus
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
            />
          ) : (
            <p className="text-surface-800">
              {diagnosis || (
                <span className="text-surface-400 italic">
                  {isExtracting ? 'Extracting...' : 'No diagnosis extracted - tap Edit to add'}
                </span>
              )}
            </p>
          )}

          {chiefComplaint && (
            <p className="text-sm text-surface-500 mt-2">
              <span className="font-medium">Chief Complaint:</span> {chiefComplaint}
            </p>
          )}
        </section>

        {/* Medications */}
        <section className="glass-card-solid p-4 sm:p-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-surface-700 uppercase tracking-wider">
              Medications ({medications.length})
            </h2>
            <button
              onClick={() => setShowDrugPad(!showDrugPad)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Plus size={12} /> Add Medicine
            </button>
          </div>

          {showDrugPad && !selectedDrug && (
            <div className="mb-4">
              <DrugSearchInput
                onSelect={(drug) => setSelectedDrug(drug)}
                placeholder="Search to add medicine..."
              />
            </div>
          )}

          {selectedDrug && (
            <div className="mb-4">
              <DrugEntryCard
                drug={selectedDrug}
                onConfirm={(med) => {
                  setMedications((prev) => [...prev, { ...med, display_order: prev.length }]);
                  setSelectedDrug(null);
                  setShowDrugPad(false);
                }}
                onCancel={() => { setSelectedDrug(null); setShowDrugPad(false); }}
              />
            </div>
          )}

          <MedicationList
            medications={medications}
            onRemove={(id) => setMedications((prev) => prev.filter((m) => m.id !== id))}
          />
        </section>

        {/* Instructions */}
        <section className="glass-card-solid p-4 sm:p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-surface-700 uppercase tracking-wider">
              Instructions
            </h2>
          </div>
          <ul className="space-y-2">
            {instructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
                <span className="text-primary-500 mt-0.5">-</span>
                <span className="flex-1">{inst}</span>
                <button
                  onClick={() => setInstructions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1 rounded hover:bg-danger-50 text-surface-400 hover:text-danger-600 transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              placeholder="Add instruction..."
              className="input flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newInstruction.trim()) {
                  setInstructions((prev) => [...prev, newInstruction.trim()]);
                  setNewInstruction('');
                }
              }}
            />
            <button
              onClick={() => {
                if (newInstruction.trim()) {
                  setInstructions((prev) => [...prev, newInstruction.trim()]);
                  setNewInstruction('');
                }
              }}
              className="btn-secondary text-sm"
            >
              <Plus size={14} />
            </button>
          </div>
        </section>

        {/* Follow-up & Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <section className="glass-card-solid p-4 sm:p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-sm font-bold text-surface-700 uppercase tracking-wider mb-3">
              Follow-up
            </h2>
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="e.g. In 5 days if no improvement"
              className="input"
            />
          </section>

          <section className="glass-card-solid p-4 sm:p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-sm font-bold text-surface-700 uppercase tracking-wider mb-3">
              Tests Ordered
            </h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {testsOrdered.map((test, i) => (
                <span key={i} className="chip chip-active group">
                  {test}
                  <button
                    onClick={() => setTestsOrdered((prev) => prev.filter((_, idx) => idx !== i))}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTest}
                onChange={(e) => setNewTest(e.target.value)}
                placeholder="e.g. CBC"
                className="input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTest.trim()) {
                    setTestsOrdered((prev) => [...prev, newTest.trim()]);
                    setNewTest('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newTest.trim()) {
                    setTestsOrdered((prev) => [...prev, newTest.trim()]);
                    setNewTest('');
                  }
                }}
                className="btn-secondary text-sm"
              >
                <Plus size={14} />
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/90 border-t border-surface-200 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="btn-secondary text-sm flex-1 sm:flex-none"
            >
              {isPrinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              Print
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={isSendingWhatsApp}
              className="btn-success text-sm flex-1 sm:flex-none"
            >
              {isSendingWhatsApp ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <MessageCircle size={14} />
              )}
              WhatsApp
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="btn-secondary text-sm flex-1 sm:flex-none"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              PDF
            </button>
          </div>
          <button onClick={handleComplete} className="btn-primary py-2.5 px-6 text-sm">
            <CheckCircle2 size={16} />
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}
