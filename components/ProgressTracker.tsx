import React from 'react';
import { Suggestion } from '../types';
import { SparklesIcon } from './icons';

interface ProgressTrackerProps {
  suggestions: Suggestion[];
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  increase: { label: '↑ Aumentar',   color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-700/40' },
  maintain: { label: '= Manter',     color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/40' },
  decrease: { label: '↓ Reduzir',    color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/40' },
  deload:   { label: '⟳ Deload',     color: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-700/40' },
  plateau:  { label: '⚡ Plateau',   color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-700/40' },
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-8 animate-fade-in pb-10">
      <div className="flex items-center space-x-3 mb-6 px-1">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white leading-none">Sugestões da IA</h2>
          <p className="text-xs text-gray-400 mt-1">Baseado na sua performance e histórico.</p>
        </div>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const diff = suggestion.currentWeight != null
            ? suggestion.suggestedWeight - suggestion.currentWeight
            : null;

          const deltaLabel = diff == null ? null
            : diff > 0 ? { text: `+${diff}kg`, color: 'text-green-400', bg: 'bg-green-900/40 border-green-700/40' }
            : diff < 0 ? { text: `${diff}kg`, color: 'text-red-400', bg: 'bg-red-900/40 border-red-700/40' }
            : { text: 'Mantido', color: 'text-yellow-400', bg: 'bg-yellow-900/40 border-yellow-700/40' };

          const recType = suggestion.recommendation_type && RECOMMENDATION_LABELS[suggestion.recommendation_type]
            ? RECOMMENDATION_LABELS[suggestion.recommendation_type]
            : null;

          const hasTechnique = suggestion.technique && suggestion.technique.trim().length > 0;
          const hasPeriodNote = suggestion.periodization_note && suggestion.periodization_note.trim().length > 0;

          return (
            <div
              key={suggestion.exerciseId || index}
              className="bg-gray-800 border border-gray-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden hover:border-indigo-500/50 transition-colors"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex justify-between items-start gap-3 mb-4 relative z-10">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-lg leading-tight break-words">{suggestion.exerciseName}</h4>
                  {/* Recommendation type badge */}
                  {recType && (
                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${recType.color} ${recType.bg} ${recType.border}`}>
                      {recType.label}
                    </span>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Próxima Carga</p>
                  <div className="flex items-end justify-end space-x-1 text-indigo-400">
                    <span className="text-3xl font-black">{suggestion.suggestedWeight}</span>
                    <span className="text-sm font-bold mb-1">kg</span>
                  </div>
                  {deltaLabel && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${deltaLabel.bg} ${deltaLabel.color}`}>
                      {deltaLabel.text}
                    </span>
                  )}
                </div>
              </div>

              {/* AI message */}
              <div className="bg-gray-900/60 rounded-xl p-3 border border-gray-700/50 relative z-10">
                <div className="flex items-start space-x-2">
                  <SparklesIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300 italic">"{suggestion.message}"</p>
                </div>
              </div>

              {/* Technique badge (only for plateau) */}
              {hasTechnique && (
                <div className="mt-3 relative z-10 flex items-center gap-2 bg-orange-900/20 border border-orange-700/30 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Técnica</span>
                  <span className="text-orange-300 text-xs font-bold">{suggestion.technique}</span>
                </div>
              )}

              {/* Periodization note */}
              {hasPeriodNote && (
                <div className="mt-2 relative z-10 flex items-start gap-2 bg-indigo-900/20 border border-indigo-700/30 rounded-xl px-3 py-2">
                  <span className="text-indigo-400 text-xs flex-shrink-0">📋</span>
                  <p className="text-indigo-300 text-xs leading-relaxed">{suggestion.periodization_note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
