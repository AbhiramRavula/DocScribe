'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { searchDrugs } from '@/lib/drug-search';
import type { DrugEntry } from '@/types';

interface DrugSearchInputProps {
  onSelect: (drug: DrugEntry) => void;
  placeholder?: string;
}

export default function DrugSearchInput({
  onSelect,
  placeholder = 'Search medicines...',
}: DrugSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ item: DrugEntry; score: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fuzzy search on query change
  useEffect(() => {
    if (query.trim().length >= 2) {
      const hits = searchDrugs(query);
      setResults(hits);
      setIsOpen(hits.length > 0);
      setHighlightIndex(0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    (drug: DrugEntry) => {
      onSelect(drug);
      setQuery('');
      setResults([]);
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlightIndex]) {
        handleSelect(results[highlightIndex].item);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="input pl-9"
          autoComplete="off"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg max-h-64 overflow-y-auto custom-scroll animate-scale-in"
        >
          {results.map((result, idx) => (
            <button
              key={result.item.id}
              onClick={() => handleSelect(result.item)}
              className={`w-full text-left px-4 py-3 transition-colors border-b border-surface-100 last:border-0 ${
                idx === highlightIndex
                  ? 'bg-primary-50'
                  : 'hover:bg-surface-50'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-surface-800">
                  {result.item.generic_name}
                </span>
                <span className="text-xs text-surface-500">
                  {result.item.standard_dosages[0]}
                </span>
              </div>
              <div className="text-xs text-surface-500 mt-0.5">
                {result.item.brand_names.slice(0, 4).join(', ')}
                {result.item.brand_names.length > 4 && '...'}
              </div>
              <div className="text-xs text-primary-600 mt-0.5">
                {result.item.common_for.join(' · ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
