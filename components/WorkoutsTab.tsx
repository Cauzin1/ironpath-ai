import React, { useState } from 'react';
import { Workout } from '../types';
import { UploadIcon, PlusIcon, DumbbellIcon, ChevronDownIcon, PlayIcon } from './icons';

interface WorkoutsTabProps {
  workouts: Workout[];
  currentWorkoutIndex: number;
  onImport: (file: File, mode: 'replace' | 'append') => void;
  onSelectAndGo: (index: number) => void;
}

const getWorkoutAbbr = (name: string): string => {
  const match = name.match(/Treino\s+(\w+)/i);
  if (match) return match[1].toUpperCase();
  const words = name.split(/[\s\-–]+/);
  return words[0].substring(0, 3).toUpperCase();
};

const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
};

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
  workouts,
  currentWorkoutIndex,
  onImport,
  onSelectAndGo,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (workouts.length === 0) {
    return (
      <div className="p-5 pb-28 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
        <div className="bg-gray-800 p-5 rounded-full">
          <DumbbellIcon className="w-10 h-10 text-gray-500" />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold mb-1">Nenhum treino carregado</h2>
          <p className="text-gray-400 text-sm">Importe uma ficha de treino em PDF para começar</p>
        </div>
        <label className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer text-white font-bold">
          <UploadIcon className="w-5 h-5" />
          Importar PDF
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'replace'); e.currentTarget.value = ''; }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center pt-1">
        <div>
          <h1 className="text-2xl font-black text-white">Meus Treinos</h1>
          <p className="text-gray-400 text-sm mt-0.5">{workouts.length} dia{workouts.length !== 1 ? 's' : ''} de treino</p>
        </div>
      </div>

      {/* Workout day cards */}
      <div className="space-y-3">
        {workouts.map((workout, index) => {
          const isActive = currentWorkoutIndex === index;
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={index}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isActive
                  ? 'bg-indigo-900/30 border-indigo-500/50'
                  : 'bg-gray-800/60 border-gray-700/50'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 flex items-center gap-3">
                {/* Abbr badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {getWorkoutAbbr(workout.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm leading-tight truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                    {workout.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {workout.scheduledDays && (
                      <span className="text-indigo-400 text-xs">{workout.scheduledDays}</span>
                    )}
                    <span className="text-gray-500 text-xs">{workout.exercises.length} exercícios</span>
                    {workout.lastPerformedDate && (
                      <span className="text-gray-600 text-xs">· Último: {formatDate(workout.lastPerformedDate)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onSelectAndGo(index)}
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white'
                    }`}
                    title="Ir para este treino"
                  >
                    <PlayIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded exercise list */}
              {isExpanded && (
                <div className="border-t border-gray-700/50 px-4 py-3 space-y-2">
                  {workout.exercises.map((ex) => (
                    <div key={ex.id} className="flex justify-between items-center py-1">
                      <span className="text-gray-300 text-sm">{ex.name}</span>
                      <span className="text-gray-500 text-xs font-medium ml-3 flex-shrink-0">
                        {ex.sets}x{ex.reps}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Import actions */}
      <div className="pt-2 space-y-3">
        <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Gerenciar programa</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Replace */}
          <label className="flex flex-col items-center justify-center gap-2 bg-gray-800/60 border border-gray-700/50 hover:border-red-500/40 active:scale-95 transition-all rounded-2xl p-4 cursor-pointer text-center">
            <UploadIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Substituir</p>
              <p className="text-gray-500 text-xs mt-0.5">Novo programa</p>
            </div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'replace'); e.currentTarget.value = ''; }}
            />
          </label>

          {/* Append */}
          <label className="flex flex-col items-center justify-center gap-2 bg-gray-800/60 border border-gray-700/50 hover:border-indigo-500/40 active:scale-95 transition-all rounded-2xl p-4 cursor-pointer text-center">
            <PlusIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Adicionar</p>
              <p className="text-gray-500 text-xs mt-0.5">Mais dias de treino</p>
            </div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'append'); e.currentTarget.value = ''; }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
