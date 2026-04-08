import React, { useState, useRef, useEffect } from 'react';
import { EXERCISE_GROUPS, ALL_EXERCISES } from '../../data/exercises';

interface ExercisePickerProps {
  onSelect: (name: string) => void;
  onClose: () => void;
}

export const ExercisePicker: React.FC<ExercisePickerProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const groupScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const query = search.trim().toLowerCase();

  // Resultados filtrados
  const results = query
    ? ALL_EXERCISES.filter(e => e.name.toLowerCase().includes(query))
    : activeGroup
    ? EXERCISE_GROUPS.find(g => g.id === activeGroup)?.exercises.map(name => ({
        name,
        group: EXERCISE_GROUPS.find(g => g.id === activeGroup)!.label,
        groupEmoji: EXERCISE_GROUPS.find(g => g.id === activeGroup)!.emoji,
      })) ?? []
    : [];

  const showResults = query.length > 0 || activeGroup !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-3xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <h3 className="text-white font-bold text-lg">Escolher Exercício</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white text-xl rounded-lg hover:bg-gray-800 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar exercício..."
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveGroup(null); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-9 pr-4 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Group pills */}
        {!query && (
          <div
            ref={groupScrollRef}
            className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-hide flex-shrink-0"
          >
            {EXERCISE_GROUPS.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(activeGroup === g.id ? null : g.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  activeGroup === g.id
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <span>{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">
          {!showResults ? (
            /* Initial state — show all groups as cards */
            <div className="grid grid-cols-2 gap-2 pb-4">
              {EXERCISE_GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-4 text-left hover:border-emerald-500/40 hover:bg-gray-800 active:scale-95 transition-all"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <p className="text-white font-bold text-sm mt-2">{g.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{g.exercises.length} exercícios</p>
                </button>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">Nenhum exercício encontrado.</p>
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-emerald-400 text-sm font-semibold"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {results.map((ex, i) => (
                <button
                  key={`${ex.name}-${i}`}
                  onClick={() => { onSelect(ex.name); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors text-left group"
                >
                  <div className="w-9 h-9 bg-gray-800 group-hover:bg-gray-700 border border-gray-700 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors">
                    {ex.groupEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight">{ex.name}</p>
                    {query && (
                      <p className="text-gray-500 text-xs mt-0.5">{ex.group}</p>
                    )}
                  </div>
                  <span className="text-emerald-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">+</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
