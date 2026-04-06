import React, { useState } from 'react';
import { Workout } from '../types';
import { UploadIcon, DumbbellIcon, ChevronDownIcon, PlayIcon } from './icons';

interface WorkoutsTabProps {
  workouts: Workout[];
  currentWorkoutIndex: number;
  onImport: (file: File, mode: 'replace' | 'append') => void;
  onSelectAndGo: (index: number) => void;
  onDeleteWorkout: (index: number) => void;
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
  onDeleteWorkout,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  return (
    <div className="p-5 space-y-5 pb-28">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-black text-white">Meus Treinos</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {workouts.length === 0
            ? 'Nenhum treino carregado — importe uma ficha em PDF'
            : `${workouts.length} divisão${workouts.length !== 1 ? 'ões' : ''} · Selecione para iniciar a sessão`}
        </p>
      </div>

      {/* Empty state */}
      {workouts.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-5">
          <div className="bg-gray-800 p-5 rounded-full">
            <DumbbellIcon className="w-10 h-10 text-gray-500" />
          </div>
          <label className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer text-white font-bold">
            <UploadIcon className="w-5 h-5" />
            Importar PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'append'); e.currentTarget.value = ''; }}
            />
          </label>
        </div>
      )}

      {/* Workout day cards */}
      {workouts.length > 0 && (
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                          : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <PlayIcon className="w-3.5 h-3.5" />
                      {isActive ? 'Continuar' : 'Iniciar'}
                    </button>
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                      title={isExpanded ? 'Recolher' : 'Ver exercícios'}
                    >
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded exercise list */}
                {isExpanded && (
                  <div className="border-t border-gray-700/50">
                    <div className="px-4 py-3 space-y-1.5">
                      {workout.exercises.map((ex) => (
                        <div key={ex.id} className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ex.history.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <span className="text-gray-300 text-sm truncate">{ex.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {ex.currentWeight > 0 && (
                              <span className="text-indigo-400 text-xs font-semibold">{ex.currentWeight}kg</span>
                            )}
                            <span className="text-gray-500 text-xs">{ex.sets}×{ex.reps}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delete button inside expanded panel */}
                    <div className="px-4 pb-3">
                      {confirmDelete === index ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="flex-1 py-2 rounded-xl bg-gray-700 text-gray-300 text-xs font-semibold hover:bg-gray-600 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => { onDeleteWorkout(index); setConfirmDelete(null); setExpandedIndex(null); }}
                            className="flex-1 py-2 rounded-xl bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold hover:bg-red-900 transition-colors"
                          >
                            Confirmar exclusão
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(index)}
                          className="w-full py-2 rounded-xl bg-gray-700/40 text-gray-500 text-xs font-semibold hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          Remover este treino
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new workout button */}
      {workouts.length > 0 && (
        <label className="flex items-center justify-center gap-3 bg-gray-800/60 border border-dashed border-gray-600 hover:border-indigo-500/50 hover:bg-gray-800 active:scale-95 transition-all rounded-2xl p-4 cursor-pointer">
          <UploadIcon className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-white text-sm font-semibold">Adicionar novo treino</p>
            <p className="text-gray-500 text-xs">Importar PDF com mais divisões</p>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'append'); e.currentTarget.value = ''; }}
          />
        </label>
      )}
    </div>
  );
};
