import React, { useState, useEffect } from 'react'; // Adicionado useEffect
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
  onWorkoutComplete: () => void;
  onNewWorkout: (s: Suggestion[]) => void;
}

export const WorkoutPlanner: React.FC<WPProps> = ({ 
  workout, 
  userProfile,
  onUpdateWeight, 
  onToggleSet, 
  onFinishExercise, 
  onWorkoutComplete, 
  onNewWorkout 
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  // Efeito para resetar quando o workout mudar
  useEffect(() => {
    setFinished(false);
    setSuggestions([]);
    setLoading(false);
  }, [workout]);

  const handleFinish = async () => {
    if(!window.confirm("Finalizar treino e gerar sugestões?")) return;
    
    setLoading(true);
    onWorkoutComplete(); // Para o timer
    
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const sugs = await getAIWorkoutSuggestions(workout);
      
      // CORREÇÃO: Verificação mais robusta
      if (!sugs || !Array.isArray(sugs) || sugs.length === 0) {
          console.warn("AI returned invalid suggestions:", sugs);
          const fallback = workout.exercises.map(e => ({
              exerciseId: e.id, 
              exerciseName: e.name, 
              suggestedWeight: e.currentWeight, 
              message: "Treino registrado. Carga mantida."
          }));
          setSuggestions(fallback);
      } else {
          // CORREÇÃO: Garantir que todas as sugestões tenham os campos necessários
          const validatedSugs = workout.exercises.map(exercise => {
              const suggestion = sugs.find(s => s.exerciseId === exercise.id);
              if (suggestion) {
                  return {
                      exerciseId: exercise.id,
                      exerciseName: exercise.name,
                      suggestedWeight: suggestion.suggestedWeight > 0 ? suggestion.suggestedWeight : exercise.currentWeight,
                      message: suggestion.message || "Carga ajustada."
                  };
              }
              return {
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  suggestedWeight: exercise.currentWeight,
                  message: "Treino registrado. Carga mantida."
              };
          });
          setSuggestions(validatedSugs);
      }

      setFinished(true); // Só agora mostra a tela final
      
      setTimeout(() => {
          const element = document.getElementById('suggestions-section');
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (error) { 
        console.error("Erro ao gerar sugestões:", error);
        
        // CORREÇÃO IMPORTANTE: Criar sugestões de fallback ANTES de setFinished
        const fallback = workout.exercises.map(e => ({
            exerciseId: e.id, 
            exerciseName: e.name, 
            suggestedWeight: e.currentWeight, 
            message: "Erro na conexão com IA. Carga mantida por segurança."
        }));
        setSuggestions(fallback);
        setFinished(true); // Mostra a tela final com as sugestões de fallback
        
        // Não usar alert() - pode interromper o fluxo
        // Em vez disso, mostre uma mensagem no UI
    } finally {
      setLoading(false);
    }
  };

  // CORREÇÃO: Verificar se todas as sugestões foram carregadas
  const hasValidSuggestions = suggestions.length > 0 && 
    suggestions.every(s => 
      s.exerciseId && 
      s.exerciseName && 
      typeof s.suggestedWeight === 'number' && 
      s.message
    );

  return (
    <div className="pb-40"> 
      <div className="px-1 mb-6">
        <h2 className="text-2xl font-black text-white leading-none tracking-tight">{workout.name}</h2>
        <p className="text-xs text-indigo-400 uppercase font-bold mt-2 bg-indigo-900/30 inline-block px-2 py-1 rounded">
            {workout.exercises.length} EXERCÍCIOS
        </p>
      </div>

      {/* Se NÃO finalizou, mostra a lista para preencher. Se finalizou, esconde para focar no resultado */}
      {!finished && (
          <ExerciseList 
            exercises={workout.exercises} 
            onWeightChange={onUpdateWeight} 
            onSetToggle={onToggleSet} 
            onFinishExercise={onFinishExercise} 
            isWorkoutFinished={finished} 
          />
      )}
      
      <div className="mt-8 px-2">
        {!finished ? (
            <button 
                onClick={handleFinish} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-70 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center space-x-3 text-lg transition-transform active:scale-95 border border-indigo-400/30"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
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
                            // Fallback seguro
                            const fallback = workout.exercises.map(e => ({
                                exerciseId: e.id,
                                exerciseName: e.name,
                                suggestedWeight: e.currentWeight,
                                message: "Iniciando novo ciclo."
                            }));
                            onNewWorkout(fallback);
                        }
                        setFinished(false); 
                        setSuggestions([]); 
                        window.scrollTo({top:0, behavior:'smooth'}); 
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

      {/* Mostrar mensagem de erro se não houver sugestões válidas */}
      {finished && !hasValidSuggestions && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
              <p className="text-red-400 font-bold">Erro ao carregar sugestões</p>
              <p className="text-gray-300 text-sm">As cargas foram mantidas para segurança.</p>
          </div>
      )}
    </div>
  );
};