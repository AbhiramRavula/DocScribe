'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrugEntry, Medication } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface DrugEntryCardProps {
  drug: DrugEntry;
  onConfirm: (medication: Medication) => void;
  onCancel: () => void;
  source?: 'manual' | 'speech_suggestion';
}

const FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'Night', 'SOS'];
const DURATION_OPTIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '30 days'];
const TIMING_OPTIONS = [
  { label: 'AC', value: 'AC', description: 'Before meals' },
  { label: 'PC', value: 'PC', description: 'After meals' },
  { label: 'None', value: null, description: '' },
];

export default function DrugEntryCard({
  drug,
  onConfirm,
  onCancel,
  source = 'manual',
}: DrugEntryCardProps) {
  const [dosage, setDosage] = useState(drug.standard_dosages[0] || '');
  const [customDosage, setCustomDosage] = useState('');
  const [frequency, setFrequency] = useState(drug.standard_frequencies[0] || 'BD');
  const [duration, setDuration] = useState(drug.common_durations[0] || '5 days');
  const [customDuration, setCustomDuration] = useState('');
  const [timing, setTiming] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [useCustomDosage, setUseCustomDosage] = useState(false);
  const [useCustomDuration, setUseCustomDuration] = useState(false);

  const handleConfirm = () => {
    const finalDosage = useCustomDosage ? customDosage : dosage;
    const finalDuration = useCustomDuration ? customDuration : duration;

    if (!finalDosage) return;

    const medication: Medication = {
      id: uuidv4(),
      drug_id: drug.id,
      display_name: `${drug.brand_names[0] || drug.generic_name} ${finalDosage}`,
      generic_name: drug.generic_name,
      dosage: finalDosage,
      frequency,
      duration: finalDuration,
      timing,
      special_notes: notes || null,
      source,
      display_order: 0,
    };

    onConfirm(medication);
  };

  return (
    <div className="glass-card-solid p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-surface-800">
            {drug.generic_name}
          </h4>
          <p className="text-xs text-surface-500">
            {drug.brand_names.slice(0, 3).join(', ')} · {drug.category}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Dosage */}
      <div className="mb-3">
        <label className="input-label">Dosage</label>
        <div className="flex flex-wrap gap-2">
          {drug.standard_dosages.map((d) => (
            <button
              key={d}
              onClick={() => { setDosage(d); setUseCustomDosage(false); }}
              className={cn('chip', !useCustomDosage && dosage === d && 'chip-active')}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setUseCustomDosage(true)}
            className={cn('chip', useCustomDosage && 'chip-active')}
          >
            Custom
          </button>
        </div>
        {useCustomDosage && (
          <input
            type="text"
            value={customDosage}
            onChange={(e) => setCustomDosage(e.target.value)}
            placeholder="e.g. 875mg"
            className="input mt-2"
            autoFocus
          />
        )}
      </div>

      {/* Frequency */}
      <div className="mb-3">
        <label className="input-label">Frequency</label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={cn('chip', frequency === f && 'chip-active')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-3">
        <label className="input-label">Duration</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => { setDuration(d); setUseCustomDuration(false); }}
              className={cn('chip', !useCustomDuration && duration === d && 'chip-active')}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setUseCustomDuration(true)}
            className={cn('chip', useCustomDuration && 'chip-active')}
          >
            Custom
          </button>
        </div>
        {useCustomDuration && (
          <input
            type="text"
            value={customDuration}
            onChange={(e) => setCustomDuration(e.target.value)}
            placeholder="e.g. 21 days"
            className="input mt-2"
            autoFocus
          />
        )}
      </div>

      {/* Timing */}
      <div className="mb-3">
        <label className="input-label">Timing</label>
        <div className="flex flex-wrap gap-2">
          {TIMING_OPTIONS.map((t) => (
            <button
              key={t.label}
              onClick={() => setTiming(t.value)}
              className={cn('chip', timing === t.value && 'chip-active')}
              title={t.description}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="input-label">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. with warm water"
          className="input"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
        <button onClick={handleConfirm} className="btn-primary text-sm">
          <Check size={16} /> Add Medicine
        </button>
      </div>
    </div>
  );
}
