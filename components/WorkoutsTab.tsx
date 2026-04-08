import React, { useState } from 'react';
import { Workout, AssignedWorkout } from '../types';
import { UploadIcon, DumbbellIcon, PlayIcon } from './icons';

interface WorkoutsTabProps {
  workouts: Workout[];
  currentWorkoutIndex: number;
  onImport: (file: File, mode: 'replace' | 'append') => void;
  onSelectAndGo: (index: number) => void;
  onDeleteWorkout: (index: number) => void;
  assignedWorkouts?: AssignedWorkout[];
  onActivateAssignment?: (a: AssignedWorkout) => Promise<void>;
}

const getDayAbbr = (name: string): string => {
  const match = name.match(/Treino\s+(\w+)/i);
  if (match) return match[1].toUpperCase();
  const match2 = name.match(/Dia\s+(\w+)/i);
  if (match2) return match2[1].toUpperCase();
  return name.substring(0, 2).toUpperCase();
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
  assignedWorkouts = [],
  onActivateAssignment,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmActivate, setConfirmActivate] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  return (
    <div className="p-5 space-y-5 pb-28">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-black text-white">Meus Planos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gerencie seu programa de treino</p>
      </div>

      {/* Programas do Professor */}
      {assignedWorkouts.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold px-1">Programas do Professor</p>
          {assignedWorkouts.map(a => (
            <div key={a.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                    🎓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold leading-tight truncate">{a.workout_name}</p>
                    <p className="text-emerald-400 text-xs mt-0.5">Prof. {a.trainer_name}</p>
                    <p className="text-gray-500 text-xs">
                      {a.workouts.length} dia{a.workouts.length !== 1 ? 's' : ''} ·{' '}
                      {a.workouts.reduce((acc, w) => acc + w.exercises.length, 0)} exercícios
                    </p>
                  </div>
                  {a.is_active && (
                    <span className="flex-shrink-0 bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>

                {!a.is_active && (
                  confirmActivate === a.id ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-gray-400 text-xs text-center">Isso substituirá seu programa atual.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmActivate(null)}
                          disabled={activating}
                          className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            if (!onActivateAssignment) return;
                            setActivating(true);
                            try { await onActivateAssignment(a); } finally { setActivating(false); setConfirmActivate(null); }
                          }}
                          disabled={activating}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {activating
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : 'Confirmar'
                          }
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmActivate(a.id)}
                      className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-600/30 transition-colors active:scale-95"
                    >
                      Ativar Programa
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-5">
          <div className="bg-gray-800 p-5 rounded-full">
            <DumbbellIcon className="w-10 h-10 text-gray-500" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Nenhum programa carregado</p>
            <p className="text-gray-400 text-sm mt-1">Importe sua ficha de treino em PDF para começar</p>
          </div>
          <label className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer text-white font-bold">
            <UploadIcon className="w-5 h-5" />
            Importar PDF
            <input type="file" accept="application/pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'replace'); e.currentTarget.value = ''; }} />
          </label>
        </div>
      ) : (
        <>
          {/* Programa ativo — card único */}
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <DumbbellIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold leading-tight">Programa Ativo</p>
                <p className="text-gray-400 text-sm">
                  {workouts.length} dia{workouts.length !== 1 ? 's' : ''} de treino
                </p>
              </div>
              <button
                onClick={() => onSelectAndGo(Math.min(currentWorkoutIndex, workouts.length - 1))}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all flex-shrink-0 min-h-[44px]"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                Treinar
              </button>
            </div>

            {/* Lista de dias */}
            <div className="border-t border-gray-700/40 divide-y divide-gray-700/30">
              {workouts.map((workout, index) => {
                const isActive = Math.min(currentWorkoutIndex, workouts.length - 1) === index;
                const done = workout.exercises.filter(e => e.isFinished).length;
                const total = workout.exercises.length;
                const isConfirming = confirmDelete === index;

                return (
                  <div key={index} className={`px-4 py-3 transition-colors ${isActive ? 'bg-indigo-900/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      {/* Badge do dia */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {getDayAbbr(workout.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                          {workout.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {workout.scheduledDays && (
                            <span className="text-indigo-400 text-[11px]">{workout.scheduledDays}</span>
                          )}
                          <span className="text-gray-500 text-[11px]">{total} exercícios</span>
                          {workout.lastPerformedDate && (
                            <span className="text-gray-600 text-[11px]">· {formatDate(workout.lastPerformedDate)}</span>
                          )}
                        </div>
                        {done > 0 && (
                          <div className="mt-1.5 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${(done / total) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Deletar */}
                      <button
                        onClick={() => setConfirmDelete(isConfirming ? null : index)}
                        className="text-gray-600 hover:text-red-400 transition-colors p-3 rounded-lg hover:bg-red-900/20 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Remover este dia"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Confirmação de exclusão inline */}
                    {isConfirming && (
                      <div className="mt-2.5 flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors min-h-[44px]"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => { onDeleteWorkout(index); setConfirmDelete(null); }}
                          className="flex-1 py-3 rounded-xl bg-red-900/60 border border-red-700/50 text-red-300 text-sm font-semibold hover:bg-red-900 transition-colors min-h-[44px]"
                        >
                          Remover dia
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações de importação */}
          <div className="space-y-2.5">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold px-1">Gerenciar programa</p>

            {/* Adicionar dias */}
            <label className="flex items-center gap-3 bg-gray-800/60 border border-dashed border-gray-600 hover:border-indigo-500/50 hover:bg-gray-800 active:scale-95 transition-all rounded-2xl p-4 cursor-pointer">
              <div className="w-9 h-9 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Adicionar dias ao programa</p>
                <p className="text-gray-500 text-xs">Importar PDF com mais divisões</p>
              </div>
              <input type="file" accept="application/pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'append'); e.currentTarget.value = ''; }} />
            </label>

            {/* Substituir programa */}
            <label className="flex items-center gap-3 bg-gray-800/60 border border-dashed border-gray-600 hover:border-red-500/30 hover:bg-gray-800 active:scale-95 transition-all rounded-2xl p-4 cursor-pointer">
              <div className="w-9 h-9 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <UploadIcon className="w-4 h-4 text-gray-300" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Substituir programa</p>
                <p className="text-gray-500 text-xs">Importar PDF e apagar programa atual</p>
              </div>
              <input type="file" accept="application/pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f, 'replace'); e.currentTarget.value = ''; }} />
            </label>
          </div>
        </>
      )}
    </div>
  );
};
