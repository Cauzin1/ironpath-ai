
import React from 'react';
import { Suggestion } from '../types';
import { SparklesIcon } from './icons';

interface ProgressTrackerProps {
  suggestions: Suggestion[];
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ suggestions }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <SparklesIcon className="w-7 h-7 text-indigo-400" />
        <h2 className="text-2xl font-bold text-white">Sugestões da IA para o Próximo Treino</h2>
      </div>
      <div className="space-y-4">
        {suggestions.map(suggestion => (
          <div key={suggestion.exerciseId} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-lg text-gray-100">{suggestion.exerciseName}</h4>
              <div className="text-right ml-4">
                <p className="text-sm text-gray-400">Próximo Peso</p>
                <p className="font-bold text-xl text-indigo-400">{suggestion.suggestedWeight} kg</p>
              </div>
            </div>
            <p className="mt-2 text-gray-300 text-sm">"{suggestion.message}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};
