import React, { useState, useEffect } from 'react';
import { Workout, Suggestion, UserProfile } from '../types';
import { getAIWorkoutSuggestions } from '../services/geminiService';
import { ExerciseList } from './ExerciseList';
import { ProgressTracker } from './ProgressTracker';
import { CheckCircleIcon, SparklesIcon } from './icons';

interface WPProps {
  workout: Workout;
  userProfile: UserProfile | null;
  onUpdateWeight: (id: number, w: number) => void;
  onToggleSet: (id: number, s: number) => void;
  onFinishExercise: (id: number) => void;
  onRpeChange: (id: number, rpe: number) => void;
  onWorkoutComplete: () => void;
  onNewWorkout: (s: Suggestion[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export const WorkoutPlanner: React.FC<WPProps> = ({
  workout,
  userProfile,
  onUpdateWeight,
  onToggleSet,
  onFinishExercise,
  onRpeChange,
  onWorkoutComplete,
  onNewWorkout,
  onLoadingChange,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const setLoadingWithNotify = (v: boolean) => {
    setLoading(v);
    onLoadingChange?.(v);
  };
  const [finished, setFinished] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Reset only when workout name changes, not on every set toggle
  useEffect(() => {
    setFinished(false);
    setSuggestions([]);
    setLoading(false);
  }, [workout.name]);

  const finishedCount = workout.exercises.filter(e => e.isFinished).length;
  const totalCount = workout.exercises.length;
  const progressPercent = totalCount > 0 ? (finishedCount / totalCount) * 100 : 0;

  const handleFinish = async () => {
    setShowConfirmModal(false);
    setLoadingWithNotify(true);
    onWorkoutComplete();

    try {
      const sugs = await getAIWorkoutSuggestions(workout, userProfile);

      if (!sugs || !Array.isArray(sugs) || sugs.length === 0) {
        console.warn('AI returned invalid suggestions:', sugs);
        const fallback = workout.exercises.map(e => ({
          exerciseId: e.id,
          exerciseName: e.name,
          suggestedWeight: e.currentWeight,
          message: 'Treino registrado. Carga mantida.',
        }));
        setSuggestions(fallback);
      } else {
        const validatedSugs = workout.exercises.map(exercise => {
          const suggestion = sugs.find(s => s.exerciseId === exercise.id);
          if (suggestion) {
            return {
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              suggestedWeight: suggestion.suggestedWeight > 0 ? suggestion.suggestedWeight : exercise.currentWeight,
              message: suggestion.message || 'Carga ajustada.',
            };
          }
          return {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            suggestedWeight: exercise.currentWeight,
            message: 'Treino registrado. Carga mantida.',
          };
        });
        setSuggestions(validatedSugs);
      }

      setFinished(true);

      setTimeout(() => {
        const element = document.getElementById('suggestions-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      const fallback = workout.exercises.map(e => ({
        exerciseId: e.id,
        exerciseName: e.name,
        suggestedWeight: e.currentWeight,
        message: 'Erro na conexão com IA. Carga mantida por segurança.',
      }));
      setSuggestions(fallback);
      setFinished(true);
    } finally {
      setLoadingWithNotify(false);
    }
  };

  const hasValidSuggestions =
    suggestions.length > 0 &&
    suggestions.every(
      s => s.exerciseId && s.exerciseName && typeof s.suggestedWeight === 'number' && s.message
    );

  return (
    <div className="pb-24">
      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Finalizar Treino</h2>
            <p className="text-gray-400 text-sm mb-6">
              Isso irá gerar sugestões de carga com IA para a próxima sessão.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 font-semibold hover:bg-gray-600 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl bg-indigo-600 border border-indigo-500 text-white font-semibold hover:bg-indigo-500 transition-colors active:scale-95"
              >
                Finalizar e Analisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {!finished && (
        <div className="mb-5 px-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-400 font-medium">
              {finishedCount} / {totalCount} exercícios concluídos
            </span>
            <span className="text-xs text-indigo-400 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {!finished && (
        <ExerciseList
          exercises={workout.exercises}
          onWeightChange={onUpdateWeight}
          onSetToggle={onToggleSet}
          onFinishExercise={onFinishExercise}
          onRpeChange={onRpeChange}
          isWorkoutFinished={finished}
        />
      )}

      <div className="mt-8 px-2">
        {!finished ? (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-70 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center space-x-3 text-lg transition-transform active:scale-95 border border-indigo-400/30"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analisando Performance...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 text-yellow-300" />
                <span>FINALIZAR TREINO COM IA</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-green-600/20 border border-green-500/50 p-4 rounded-xl text-center">
              <p className="text-green-400 font-bold text-lg">Treino Concluído!</p>
              <p className="text-gray-300 text-sm">Confira abaixo as cargas para a próxima semana.</p>
            </div>

            <button
              onClick={() => {
                if (hasValidSuggestions) {
                  onNewWorkout(suggestions);
                } else {
                  const fallback = workout.exercises.map(e => ({
                    exerciseId: e.id,
                    exerciseName: e.name,
                    suggestedWeight: e.currentWeight,
                    message: 'Iniciando novo ciclo.',
                  }));
                  onNewWorkout(fallback);
                }
                setFinished(false);
                setSuggestions([]);
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-5 rounded-2xl shadow-xl text-lg animate-bounce-short border border-green-400/30"
            >
              Aplicar Sugestões e Iniciar Novo Ciclo
            </button>
          </div>
        )}
      </div>

      {/* PROGRESS TRACKER (SÓ APARECE QUANDO FINALIZADO) */}
      {finished && hasValidSuggestions && (
        <div id="suggestions-section" className="mt-8">
          <ProgressTracker suggestions={suggestions} />
        </div>
      )}

      {finished && !hasValidSuggestions && (
        <div className="mt-8 p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
          <p className="text-red-400 font-bold">Erro ao carregar sugestões</p>
          <p className="text-gray-300 text-sm">As cargas foram mantidas para segurança.</p>
        </div>
      )}
    </div>
  );
};
