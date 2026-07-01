'use client';

import { Pill, Plus, X } from 'lucide-react';
import type { MentionedDrug } from '@/types';

interface DrugSuggestionChipProps {
  drug: MentionedDrug;
  onAdd: (drugName: string) => void;
  onDismiss: (drugName: string) => void;
}

export default function DrugSuggestionChip({
  drug,
  onAdd,
  onDismiss,
}: DrugSuggestionChipProps) {
  return (
    <div className="suggestion-chip animate-scale-in">
      <Pill size={14} />
      <span className="font-medium">{drug.name}</span>
      <span className="text-xs opacity-75">mentioned</span>
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={() => onAdd(drug.name)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-700/10 hover:bg-amber-700/20 text-amber-900 text-xs font-medium transition-colors"
          title="Add to prescription"
        >
          <Plus size={12} /> Add
        </button>
        <button
          onClick={() => onDismiss(drug.name)}
          className="p-0.5 rounded-full hover:bg-amber-700/10 text-amber-800 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
