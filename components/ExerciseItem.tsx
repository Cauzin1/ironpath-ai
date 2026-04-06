import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../types';
import { CheckIcon, HistoryIcon, CheckCircleIcon } from './icons';

interface ExerciseItemProps {
  exercise: Exercise;
  onWeightChange: (exerciseId: number, weight: number) => void;
  onSetToggle: (exerciseId: number, setIndex: number) => void;
  onFinishExercise: (exerciseId: number) => void;
  onRpeChange: (exerciseId: number, rpe: number) => void;
  isWorkoutFinished: boolean;
}

const COMPOUND_KEYWORDS = [
  'supino', 'agachamento', 'terra', 'remada', 'desenvolvimento',
  'press', 'pull', 'barra', 'paralela', 'leg',
];

const isCompound = (name: string): boolean => {
  const lower = name.toLowerCase();
  return COMPOUND_KEYWORDS.some(kw => lower.includes(kw));
};

const REST_COMPOUND = 90;
const REST_ISOLATION = 60;

const rpeColor = (rpe: number) => {
  if (rpe <= 4) return 'bg-green-600 border-green-500 text-white';
  if (rpe <= 7) return 'bg-yellow-600 border-yellow-500 text-white';
  return 'bg-red-600 border-red-500 text-white';
};

const rpeLabel = (rpe: number) => {
  if (rpe <= 3) return 'Leve';
  if (rpe <= 5) return 'Moderado';
  if (rpe <= 7) return 'Desafiador';
  if (rpe <= 9) return 'Muito difícil';
  return 'Falha';
};

const timerBarColor = (secondsLeft: number) => {
  if (secondsLeft < 10) return 'bg-red-500';
  if (secondsLeft < 30) return 'bg-yellow-400';
  return 'bg-indigo-500';
};

const timerTextColor = (secondsLeft: number) => {
  if (secondsLeft < 10) return 'text-red-400';
  if (secondsLeft < 30) return 'text-yellow-400';
  return 'text-indigo-300';
};

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onWeightChange,
  onSetToggle,
  onFinishExercise,
  onRpeChange,
  isWorkoutFinished
}) => {
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const totalRestRef = useRef<number>(REST_ISOLATION);

  useEffect(() => {
    if (restSecondsLeft === null) return;
    if (restSecondsLeft <= 0) { setRestSecondsLeft(null); return; }
    const id = setInterval(() => {
      setRestSecondsLeft(prev => {
        if (prev === null || prev <= 1) { clearInterval(id); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restSecondsLeft]);

  const allSetsCompleted = exercise.completedSets.length === exercise.sets;

  const handleSetToggle = (setIndex: number) => {
    const wasCompleted = exercise.completedSets.includes(setIndex);
    if (navigator.vibrate) navigator.vibrate(15);
    if (!wasCompleted) {
      const duration = isCompound(exercise.name) ? REST_COMPOUND : REST_ISOLATION;
      totalRestRef.current = duration;
      setRestSecondsLeft(duration);
    }
    onSetToggle(exercise.id, setIndex);
  };

  const dismissRestTimer = () => setRestSecondsLeft(null);

  // --- ESTADO: EXERCÍCIO FINALIZADO ---
  if (exercise.isFinished) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-3 shadow-sm animate-fade-in">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            {/* Checkbox finalizado — 44px */}
            <button
              onClick={() => onFinishExercise(exercise.id)}
              className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-400 transition-colors flex-shrink-0 active:scale-95"
            >
              <CheckIcon className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-bold text-gray-200 line-through decoration-gray-500">{exercise.name}</h3>
              <p className="text-xs text-green-400 font-medium">
                {exercise.currentWeight}kg · {exercise.completedSets.length}/{exercise.sets} séries
                {exercise.rpe != null && (
                  <span className="ml-2 text-yellow-400">RPE {exercise.rpe}</span>
                )}
              </p>
            </div>
          </div>
          {/* Botão Editar — 44px */}
          <button
            onClick={() => onFinishExercise(exercise.id)}
            className="text-xs font-bold text-gray-500 border border-gray-600 px-4 py-3 rounded-xl hover:text-white hover:border-white transition-colors min-h-[44px] flex items-center"
          >
            Editar
          </button>
        </div>

        {/* Seletor de RPE */}
        <div className="pl-14">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
            Esforço percebido (RPE)
            {exercise.rpe != null && (
              <span className="ml-2 normal-case font-normal text-yellow-400">— {rpeLabel(exercise.rpe)}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => onRpeChange(exercise.id, n)}
                className={`w-10 h-10 rounded-xl border text-xs font-bold transition-all active:scale-90 ${
                  exercise.rpe === n
                    ? rpeColor(n)
                    : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- ESTADO: EXERCÍCIO ATIVO ---
  const restPercent =
    restSecondsLeft !== null ? (restSecondsLeft / totalRestRef.current) * 100 : 0;

  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-5 mb-4 shadow-lg transition-all relative">

      <div className="flex items-start space-x-4 mb-5">

        {/* CHECKBOX FINALIZAR — 44px */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.vibrate) navigator.vibrate(20);
            onFinishExercise(exercise.id);
          }}
          className={`mt-1 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 flex-shrink-0
            ${allSetsCompleted ? 'border-green-500 bg-green-500/20' : 'border-gray-500 hover:border-gray-300'}`}
        >
          {allSetsCompleted && <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3
              className="text-lg font-bold text-white leading-tight cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => setIsHistoryVisible(!isHistoryVisible)}
            >
              {exercise.name}
            </h3>
            <button
              onClick={() => setIsHistoryVisible(!isHistoryVisible)}
              className="p-2 -mt-1 text-gray-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
            >
              <HistoryIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">{exercise.sets} séries x {exercise.reps} reps</p>
        </div>
      </div>

      {/* HISTÓRICO */}
      {isHistoryVisible && (
        <div className="mb-5 bg-gray-900/50 rounded-xl p-3 text-sm animate-fade-in border border-gray-700/30">
          <p className="text-gray-500 text-[10px] mb-2 uppercase font-bold tracking-wider">Histórico Recente</p>
          {exercise.history && exercise.history.length > 0 ? (
            <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-hide">
              {[...exercise.history].reverse().slice(0, 3).map((h, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700 flex flex-col items-center min-w-[70px]"
                >
                  <div className="text-[10px] text-gray-400 mb-1">
                    {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div className="font-bold text-indigo-300 text-sm">{h.weight}kg</div>
                  {h.rpe != null && (
                    <div className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      RPE {h.rpe}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 italic text-xs">Sem histórico registrado.</span>
          )}
        </div>
      )}

      {/* CONTROLES */}
      <div className="pl-14 space-y-5">

        {/* Carga +/- */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Carga</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onWeightChange(exercise.id, Math.max(0, exercise.currentWeight - 2.5))}
              disabled={isWorkoutFinished}
              className="w-11 h-11 rounded-xl bg-gray-700 border border-gray-600 text-white font-bold text-lg flex items-center justify-center hover:bg-gray-600 active:scale-90 transition-all disabled:opacity-40"
              aria-label="Diminuir carga"
            >
              −
            </button>
            <div className="flex items-center border-b border-gray-600 focus-within:border-indigo-500 transition-colors pb-1">
              <input
                type="number"
                inputMode="decimal"
                value={exercise.currentWeight === 0 ? '' : exercise.currentWeight}
                onChange={(e) => onWeightChange(exercise.id, parseFloat(e.target.value) || 0)}
                disabled={isWorkoutFinished}
                className="w-16 bg-transparent text-xl font-bold text-white outline-none p-0 text-center"
                placeholder="0"
              />
              <span className="text-sm text-gray-400 font-medium ml-1">kg</span>
            </div>
            <button
              onClick={() => onWeightChange(exercise.id, exercise.currentWeight + 2.5)}
              disabled={isWorkoutFinished}
              className="w-11 h-11 rounded-xl bg-gray-700 border border-gray-600 text-white font-bold text-lg flex items-center justify-center hover:bg-gray-600 active:scale-90 transition-all disabled:opacity-40"
              aria-label="Aumentar carga"
            >
              +
            </button>
          </div>
        </div>

        {/* Bolinhas de Sets — 48px (já estavam corretas) */}
        <div>
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide items-center">
            {Array.from({ length: exercise.sets }).map((_, i) => {
              const completed = exercise.completedSets.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleSetToggle(i)}
                  disabled={isWorkoutFinished}
                  className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all active:scale-90 font-bold text-lg
                    ${completed
                      ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50'
                      : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                >
                  {completed ? <CheckIcon className="w-6 h-6" /> : (i + 1)}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">Toque para marcar séries</p>
        </div>

        {/* REST TIMER */}
        {restSecondsLeft !== null && (
          <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Descanso</span>
              <span className={`text-2xl font-black tabular-nums ${timerTextColor(restSecondsLeft)}`}>
                {String(Math.floor(restSecondsLeft / 60)).padStart(2, '0')}:{String(restSecondsLeft % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerBarColor(restSecondsLeft)}`}
                style={{ width: `${restPercent}%` }}
              />
            </div>
            {/* Pular Descanso — 44px */}
            <button
              onClick={dismissRestTimer}
              className="w-full py-3.5 rounded-xl border border-gray-600 text-gray-400 text-sm font-semibold hover:text-white hover:border-gray-400 transition-colors active:scale-95 min-h-[44px]"
            >
              Pular Descanso
            </button>
          </div>
        )}

        {/* Botão Concluir */}
        {allSetsCompleted && !isWorkoutFinished && (
          <button
            onClick={() => onFinishExercise(exercise.id)}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center space-x-2 animate-bounce-short transition-transform active:scale-95 min-h-[44px]"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>Concluir Exercício</span>
          </button>
        )}

      </div>
    </div>
  );
};
