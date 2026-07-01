'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Square, Mic, MicOff, Stethoscope, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import WaveformVisualizer from '@/components/recording/WaveformVisualizer';
import LiveTranscript from '@/components/recording/LiveTranscript';
import DrugSuggestionChip from '@/components/recording/DrugSuggestionChip';
import DrugSearchInput from '@/components/prescription-pad/DrugSearchInput';
import DrugEntryCard from '@/components/prescription-pad/DrugEntryCard';
import MedicationList from '@/components/prescription-pad/MedicationList';
import { formatDuration } from '@/lib/utils';
import { searchDrugs } from '@/lib/drug-search';
import type { Medication, DrugEntry, MentionedDrug } from '@/types';

interface ConsultationData {
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  patient_gender: string | null;
  doctor: {
    id: string;
    full_name: string;
    clinic_name: string;
  };
}

export default function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: consultationId } = use(params);
  const router = useRouter();

  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    start,
    stop,
  } = useSpeechRecognition({ lang: 'en-IN' });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugEntry | null>(null);

  const [suggestions, setSuggestions] = useState<MentionedDrug[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Load consultation data
  useEffect(() => {
    const stored = sessionStorage.getItem(`consultation-${consultationId}`);
    if (stored) {
      setConsultationData(JSON.parse(stored));
    }
  }, [consultationId]);

  // Auto-start recording on mount
  useEffect(() => {
    if (isSupported && !hasStarted) {
      // Small delay to ensure component is fully mounted
      const t = setTimeout(() => {
        start();
        setHasStarted(true);
      }, 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Scan transcript for drug names
  useEffect(() => {
    if (!transcript || transcript.length < 10) return;

    const words = transcript.toLowerCase().split(/\s+/);
    const recentWords = words.slice(-30).join(' ');

    const drugKeywords = [
      'paracetamol', 'dolo', 'crocin', 'calpol',
      'amoxicillin', 'azithromycin', 'cetirizine',
      'ibuprofen', 'brufen', 'combiflam',
      'pantoprazole', 'omeprazole', 'metformin',
      'amlodipine', 'atorvastatin', 'cefixime',
      'montelukast', 'levocetirizine', 'ranitidine',
    ];

    for (const keyword of drugKeywords) {
      if (
        recentWords.includes(keyword) &&
        !dismissedSuggestions.has(keyword) &&
        !suggestions.some((s) => s.name.toLowerCase() === keyword) &&
        !medications.some((m) =>
          m.display_name.toLowerCase().includes(keyword) ||
          m.generic_name?.toLowerCase().includes(keyword),
        )
      ) {
        const hits = searchDrugs(keyword, 1);
        if (hits.length > 0) {
          setSuggestions((prev) => [
            ...prev,
            {
              name: hits[0].item.brand_names[0] || hits[0].item.generic_name,
              context: 'Mentioned in consultation',
              confidence: 'medium',
            },
          ]);
        }
      }
    }
  }, [transcript, dismissedSuggestions, suggestions, medications]);

  // Auto-save transcript
  useEffect(() => {
    if (transcript) {
      sessionStorage.setItem(`transcript-${consultationId}`, transcript);
    }
  }, [transcript, consultationId]);

  const handleDrugSelect = useCallback((drug: DrugEntry) => {
    setSelectedDrug(drug);
  }, []);

  const handleMedicationConfirm = useCallback((medication: Medication) => {
    setMedications((prev) => [
      ...prev,
      { ...medication, display_order: prev.length },
    ]);
    setSelectedDrug(null);
  }, []);

  const handleRemoveMedication = useCallback((id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleSuggestionAdd = useCallback(
    (drugName: string) => {
      const hits = searchDrugs(drugName, 1);
      if (hits.length > 0) {
        setSelectedDrug(hits[0].item);
      }
      setSuggestions((prev) => prev.filter((s) => s.name !== drugName));
    },
    [],
  );

  const handleSuggestionDismiss = useCallback((drugName: string) => {
    setSuggestions((prev) => prev.filter((s) => s.name !== drugName));
    setDismissedSuggestions((prev) => new Set(prev).add(drugName.toLowerCase()));
  }, []);

  const handleToggleMic = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  const handleStopAndReview = () => {
    stop();

    sessionStorage.setItem(
      `review-${consultationId}`,
      JSON.stringify({
        transcript,
        medications,
        consultationData,
      }),
    );

    router.push(`/consultation/${consultationId}/review`);
  };

  if (!consultationData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-6 sm:p-8 text-center max-w-sm w-full">
          <AlertCircle size={48} className="mx-auto text-warning-500 mb-4" />
          <h2 className="text-lg font-bold text-surface-800 mb-2">
            Consultation Not Found
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            Start a new consultation from the dashboard.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              {isListening && <span className="recording-dot" />}
              <span
                className={`text-sm font-semibold ${
                  isListening ? 'text-danger-600' : 'text-surface-600'
                }`}
              >
                {isListening ? 'Recording' : 'Paused'}
              </span>
            </div>
            <span className="text-surface-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-surface-700 truncate max-w-[120px] sm:max-w-none">
              {consultationData.patient_name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMic}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-danger-50 text-danger-600 hover:bg-danger-100'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
              title={isListening ? 'Pause recording' : 'Resume recording'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <span className="text-base sm:text-lg font-mono font-bold text-surface-700 tabular-nums">
              {formatDuration(elapsedSeconds)}
            </span>
            {!isSupported && (
              <span className="text-xs text-warning-500 bg-warning-50 px-2 py-1 rounded-full hidden sm:inline">
                Speech not supported
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Panel */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:h-[calc(100vh-160px)]">
          {/* LEFT PANEL — Transcript */}
          <div className="flex flex-col glass-card p-4 sm:p-5 min-h-[300px] lg:min-h-0 overflow-hidden">
            {/* Waveform */}
            <div className="mb-3 sm:mb-4">
              <WaveformVisualizer isRecording={isListening} />
            </div>

            {/* Live Transcript */}
            <div className="flex-1 overflow-hidden">
              <LiveTranscript
                transcript={transcript}
                interimText={interimTranscript}
                isRecording={isListening}
              />
            </div>

            {/* Drug Suggestions from speech */}
            {suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-200">
                <p className="text-xs text-surface-500 mb-2 font-medium">
                  Suggested from speech:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((drug) => (
                    <DrugSuggestionChip
                      key={drug.name}
                      drug={drug}
                      onAdd={handleSuggestionAdd}
                      onDismiss={handleSuggestionDismiss}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Prescription Pad */}
          <div className="flex flex-col glass-card p-4 sm:p-5 min-h-[300px] lg:min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Stethoscope size={18} className="text-primary-600" />
              <h3 className="text-sm font-semibold text-surface-700">
                Prescription Pad
              </h3>
              {medications.length > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                  {medications.length}
                </span>
              )}
            </div>

            {/* Search Input */}
            {!selectedDrug && (
              <div className="mb-3 sm:mb-4">
                <DrugSearchInput
                  onSelect={handleDrugSelect}
                  placeholder="Search medicines..."
                />
              </div>
            )}

            {/* Drug Entry Card (when a drug is selected) */}
            {selectedDrug && (
              <div className="mb-3 sm:mb-4">
                <DrugEntryCard
                  drug={selectedDrug}
                  onConfirm={handleMedicationConfirm}
                  onCancel={() => setSelectedDrug(null)}
                />
              </div>
            )}

            {/* Medication List */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              <MedicationList
                medications={medications}
                onRemove={handleRemoveMedication}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 backdrop-blur-xl bg-white/80 border-t border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center">
          <button
            onClick={handleStopAndReview}
            className="btn-danger py-2.5 sm:py-3 px-6 sm:px-8 text-sm sm:text-base"
          >
            <Square size={16} />
            Stop & Review
          </button>
        </div>
      </div>
    </div>
  );
}
