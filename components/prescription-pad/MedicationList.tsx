'use client';

import { GripVertical, Trash2, Pencil } from 'lucide-react';
import type { Medication } from '@/types';

interface MedicationListProps {
  medications: Medication[];
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function MedicationList({
  medications,
  onRemove,
  onEdit,
}: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <div className="text-center py-6 text-surface-400 text-sm">
        No medicines added yet. Search above to add.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {medications.map((med, index) => (
        <div
          key={med.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-surface-200 hover:border-primary-200 transition-colors animate-fade-in"
        >
          {/* Drag handle area */}
          <div className="text-surface-300 cursor-grab">
            <GripVertical size={16} />
          </div>

          {/* Index */}
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>

          {/* Drug info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-surface-800 truncate">
              {med.display_name}
            </div>
            <div className="text-xs text-surface-500 flex flex-wrap gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-medium">
                {med.dosage}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                {med.frequency}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                {med.duration}
              </span>
              {med.timing && (
                <span className="px-1.5 py-0.5 rounded bg-warning-50 text-amber-700">
                  {med.timing}
                </span>
              )}
              {med.source === 'speech_suggestion' && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">
                  via speech
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(med.id)}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={() => onRemove(med.id)}
              className="p-1.5 rounded-lg hover:bg-danger-50 text-surface-400 hover:text-danger-600 transition-colors"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
