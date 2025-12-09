import React from 'react';
import { Suggestion } from '../types';
import { SparklesIcon, DumbbellIcon } from './icons';

interface ProgressTrackerProps {
  suggestions: Suggestion[];
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in pb-10">
      {/* Título da Seção */}
      <div className="flex items-center space-x-3 mb-6 px-1">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
            <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white leading-none">Sugestões da IA</h2>
          <p className="text-xs text-gray-400 mt-1">Baseado na sua performance hoje.</p>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div 
            key={suggestion.exerciseId || index} 
            className="bg-gray-800 border border-gray-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors"
          >
            {/* Decoração de Fundo */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <h4 className="font-bold text-white text-lg w-2/3 leading-tight">{suggestion.exerciseName}</h4>
              
              {/* Box de Carga */}
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Próxima Carga</p>
                <div className="flex items-center justify-end space-x-1 text-indigo-400">
                    <span className="text-3xl font-black">{suggestion.suggestedWeight}</span>
                    <span className="text-sm font-bold mt-2">kg</span>
                </div>
              </div>
            </div>

            {/* Dica da IA */}
            <div className="bg-gray-900/60 rounded-xl p-3 border border-gray-700/50 relative z-10">
              <div className="flex items-start space-x-2">
                <SparklesIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300 italic">
                  "{suggestion.message || 'Mantenha a constância!'}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};