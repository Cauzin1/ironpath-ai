import React, { useState, useRef } from 'react';
import { TrainerWorkout, Workout } from '../../types';
import { TrashIcon, PlusCircleIcon, CheckCircleIcon } from '../icons';
import { ExercisePicker } from './ExercisePicker';

interface ExerciseDraft {
  tempId: number;
  name: string;
  sets: number;
  reps: number;
  startingWeight: number;
}

interface DayDraft {
  tempId: number;
  name: string;
  scheduledDays: string;
  exercises: ExerciseDraft[];
}

interface WorkoutBuilderProps {
  trainerId: string;
  initial?: TrainerWorkout | null;
  onSave: (name: string, workouts: Workout[]) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_DAY: Omit<DayDraft, 'tempId'> = {
  name: '',
  scheduledDays: '',
  exercises: [],
};

let _idSeq = Date.now();
const nextId = () => ++_idSeq;

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  initial,
  onSave,
  onCancel,
}) => {
  const initDays = (): DayDraft[] => {
    if (initial && initial.workouts.length > 0) {
      return initial.workouts.map(w => ({
        tempId: nextId(),
        name: w.name,
        scheduledDays: w.scheduledDays ?? '',
        exercises: w.exercises.map(e => ({
          tempId: nextId(),
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          startingWeight: e.currentWeight,
        })),
      }));
    }
    return [{ tempId: nextId(), name: 'Treino A', scheduledDays: '', exercises: [] }];
  };

  const [programName, setProgramName] = useState(initial?.name ?? '');
  const [days, setDays] = useState<DayDraft[]>(initDays);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerForDay, setPickerForDay] = useState<number | null>(null); // tempId do dia que está abrindo o picker
  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeDay = days[activeDayIdx] ?? days[0];

  // ── Day operations ───────────────────────────────────────────────────────────

  const addDay = () => {
    const newDay: DayDraft = {
      ...DEFAULT_DAY,
      tempId: nextId(),
      name: `Treino ${String.fromCharCode(65 + days.length)}`,
    };
    setDays(d => [...d, newDay]);
    setActiveDayIdx(days.length);
  };

  const removeDay = (dayTempId: number) => {
    setDays(d => {
      const filtered = d.filter(x => x.tempId !== dayTempId);
      if (filtered.length === 0) return d;
      return filtered;
    });
    setActiveDayIdx(i => Math.min(i, days.length - 2));
  };

  const updateDay = (dayTempId: number, patch: Partial<DayDraft>) => {
    setDays(d => d.map(x => x.tempId === dayTempId ? { ...x, ...patch } : x));
  };

  // ── Exercise operations ──────────────────────────────────────────────────────

  const addExerciseByName = (dayTempId: number, name: string) => {
    const ex: ExerciseDraft = { tempId: nextId(), name, sets: 3, reps: 10, startingWeight: 0 };
    setDays(d => d.map(x =>
      x.tempId === dayTempId ? { ...x, exercises: [...x.exercises, ex] } : x
    ));
  };

  const updateExercise = (dayTempId: number, exTempId: number, patch: Partial<ExerciseDraft>) => {
    setDays(d => d.map(day =>
      day.tempId === dayTempId
        ? { ...day, exercises: day.exercises.map(e => e.tempId === exTempId ? { ...e, ...patch } : e) }
        : day
    ));
  };

  const removeExercise = (dayTempId: number, exTempId: number) => {
    setDays(d => d.map(day =>
      day.tempId === dayTempId
        ? { ...day, exercises: day.exercises.filter(e => e.tempId !== exTempId) }
        : day
    ));
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!programName.trim()) {
      setError('Informe o nome do programa.');
      nameInputRef.current?.focus();
      return;
    }
    const hasEmpty = days.some(d => !d.name.trim() || d.exercises.length === 0);
    if (hasEmpty) { setError('Todos os dias precisam ter nome e pelo menos 1 exercício.'); return; }

    const workouts: Workout[] = days.map(d => ({
      name: d.name.trim(),
      scheduledDays: d.scheduledDays.trim(),
      exercises: d.exercises.map((e, i) => ({
        id: i + 1,
        name: e.name.trim(),
        sets: e.sets,
        reps: e.reps,
        currentWeight: e.startingWeight,
        completedSets: [],
        isFinished: false,
        history: [],
      })),
    }));

    setSaving(true);
    setError(null);
    try {
      await onSave(programName.trim(), workouts);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar. Tente novamente.');
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="animate-fade-in pb-10">
        {/* Program name */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Nome do Programa
          </label>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Ex: Hipertrofia 4 dias — Push/Pull/Legs"
            value={programName}
            onChange={e => setProgramName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3.5 text-white text-base font-semibold focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Day tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {days.map((day, idx) => (
            <button
              key={day.tempId}
              onClick={() => setActiveDayIdx(idx)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
                activeDayIdx === idx
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {day.name || `Dia ${idx + 1}`}
            </button>
          ))}
          <button
            onClick={addDay}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-bold border border-dashed border-gray-600 text-gray-500 hover:text-white hover:border-gray-400 transition-all"
          >
            + Dia
          </button>
        </div>

        {/* Active day editor */}
        {activeDay && (
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 space-y-4">
            {/* Day name + scheduled days */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome do dia</label>
                <input
                  type="text"
                  placeholder="Ex: Push (Empurrar)"
                  value={activeDay.name}
                  onChange={e => updateDay(activeDay.tempId, { name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dias da semana</label>
                <input
                  type="text"
                  placeholder="Ex: Seg e Qui"
                  value={activeDay.scheduledDays}
                  onChange={e => updateDay(activeDay.tempId, { scheduledDays: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Exercícios {activeDay.exercises.length > 0 && `(${activeDay.exercises.length})`}
                </p>
              </div>

              {activeDay.exercises.length === 0 && (
                <div className="py-6 flex flex-col items-center gap-2 text-center">
                  <span className="text-3xl">🏋️</span>
                  <p className="text-gray-500 text-sm">Nenhum exercício adicionado.</p>
                  <p className="text-gray-600 text-xs">Toque em "+ Adicionar" para escolher da lista.</p>
                </div>
              )}

              {activeDay.exercises.map((ex, exIdx) => (
                <div key={ex.tempId} className="bg-gray-900/70 border border-gray-700/40 rounded-xl overflow-hidden">
                  {/* Exercise header */}
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <span className="w-5 h-5 bg-emerald-600/30 rounded text-emerald-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {exIdx + 1}
                    </span>
                    <p className="flex-1 text-white text-sm font-semibold leading-tight truncate">{ex.name}</p>
                    <button
                      onClick={() => removeExercise(activeDay.tempId, ex.tempId)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20 flex-shrink-0"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Sets */}
                    <div className="flex-1 flex flex-col items-center gap-1 bg-gray-800/80 rounded-lg py-2">
                      <span className="text-gray-500 text-[9px] uppercase font-bold">Séries</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateExercise(activeDay.tempId, ex.tempId, { sets: Math.max(1, ex.sets - 1) })}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm flex items-center justify-center active:scale-90 transition-all"
                        >−</button>
                        <span className="text-white font-black text-base w-5 text-center">{ex.sets}</span>
                        <button
                          onClick={() => updateExercise(activeDay.tempId, ex.tempId, { sets: Math.min(10, ex.sets + 1) })}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm flex items-center justify-center active:scale-90 transition-all"
                        >+</button>
                      </div>
                    </div>

                    {/* Reps */}
                    <div className="flex-1 flex flex-col items-center gap-1 bg-gray-800/80 rounded-lg py-2">
                      <span className="text-gray-500 text-[9px] uppercase font-bold">Reps</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateExercise(activeDay.tempId, ex.tempId, { reps: Math.max(1, ex.reps - 1) })}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm flex items-center justify-center active:scale-90 transition-all"
                        >−</button>
                        <span className="text-white font-black text-base w-5 text-center">{ex.reps}</span>
                        <button
                          onClick={() => updateExercise(activeDay.tempId, ex.tempId, { reps: Math.min(100, ex.reps + 1) })}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm flex items-center justify-center active:scale-90 transition-all"
                        >+</button>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="flex-1 flex flex-col items-center gap-1 bg-gray-800/80 rounded-lg py-2">
                      <span className="text-gray-500 text-[9px] uppercase font-bold">Carga (kg)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={ex.startingWeight === 0 ? '' : ex.startingWeight}
                        onChange={e => updateExercise(activeDay.tempId, ex.tempId, { startingWeight: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-14 bg-transparent text-white font-black text-base text-center outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add exercise button */}
              <button
                onClick={() => setPickerForDay(activeDay.tempId)}
                className="w-full py-3.5 rounded-xl border-2 border-dashed border-emerald-700/50 text-emerald-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-900/10 text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <PlusCircleIcon className="w-4 h-4" />
                + Adicionar Exercício
              </button>
            </div>

            {/* Remove day */}
            {days.length > 1 && (
              <button
                onClick={() => removeDay(activeDay.tempId)}
                className="w-full py-2 rounded-xl text-red-500 text-xs font-semibold hover:bg-red-900/20 transition-colors"
              >
                Remover este dia
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-700/50 rounded-xl p-3 flex items-start justify-between gap-2">
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-lg leading-none flex-shrink-0">×</button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl bg-gray-800 border border-gray-700 text-gray-300 font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Salvar Programa
              </>
            )}
          </button>
        </div>
      </div>

      {/* Exercise picker modal */}
      {pickerForDay !== null && (
        <ExercisePicker
          onSelect={name => addExerciseByName(pickerForDay, name)}
          onClose={() => setPickerForDay(null)}
        />
      )}
    </>
  );
};
