import React, { useState } from 'react';
import { Workout, Suggestion, UserProfile } from '../types';
import { getAIWorkoutSuggestions } from '../services/geminiService';
import { ExerciseList } from './ExerciseList';
import { ProgressTracker } from './ProgressTracker';
import { CheckCircleIcon } from './icons';

interface WPProps {
  workout: Workout;
  userProfile: UserProfile | null; // Recebe o perfil do usuário para a IA
  onUpdateWeight: (id: number, w: number) => void;
  onToggleSet: (id: number, s: number) => void;
  onFinishExercise: (id: number) => void; // Função para o checkbox do exercício
  onWorkoutComplete: () => void; // Função para parar o timer
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

  const handleFinish = async () => {
    // 1. Confirmação do usuário
    if(!window.confirm("Finalizar o treino de hoje e parar o tempo?")) return;
    
    setLoading(true);
    
    // 2. Para o timer no MainApp
    onWorkoutComplete(); 
    
    try {
      // 3. Scroll para o topo para feedback visual
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 4. Chama a IA passando o treino E o perfil do usuário
      // Se userProfile for null, passa undefined (a função da IA trata isso com um padrão)
      const sugs = await getAIWorkoutSuggestions(workout, userProfile || undefined);
      
      setSuggestions(sugs);
      setFinished(true);
      
      // 5. Rola a tela até a sessão de sugestões (ProgressTracker)
      setTimeout(() => {
          const element = document.getElementById('suggestions-section');
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (e) { 
        console.error(e);
        alert("Erro ao conectar com a IA. Verifique sua conexão."); 
    }
    
    setLoading(false);
  };

  return (
    <div className="pb-40"> 
      {/* Cabeçalho do Treino */}
      <div className="px-1 mb-6">
        <h2 className="text-2xl font-black text-white leading-none tracking-tight">{workout.name}</h2>
        <p className="text-xs text-indigo-400 uppercase font-bold mt-2 tracking-widest bg-indigo-900/30 inline-block px-2 py-1 rounded">
            {workout.exercises.length} EXERCÍCIOS
        </p>
      </div>

      {/* Lista de Exercícios */}
      <ExerciseList 
        exercises={workout.exercises} 
        onWeightChange={onUpdateWeight} 
        onSetToggle={onToggleSet} 
        onFinishExercise={onFinishExercise} 
        isWorkoutFinished={finished} 
      />
      
      {/* Botão de Ação Final */}
      <div className="mt-8 px-2">
        {!finished ? (
            // Botão: Finalizar Treino (Chama a IA)
            <button 
                onClick={handleFinish} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center space-x-3 text-lg transition-transform active:scale-95 border border-indigo-400/30"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        <span>Analisando Performance...</span>
                    </>
                ) : (
                    <>
                        <CheckCircleIcon className="w-6 h-6" />
                        <span>FINALIZAR TREINO</span>
                    </>
                )}
            </button>
        ) : (
            // Botão: Iniciar Próximo Ciclo (Aplica as sugestões da IA)
            <button 
                onClick={() => { 
                    onNewWorkout(suggestions); 
                    setFinished(false); 
                    setSuggestions([]); 
                    window.scrollTo({top:0, behavior:'smooth'}); 
                }} 
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-5 rounded-2xl shadow-xl text-lg animate-bounce-short border border-green-400/30"
            >
                Iniciar Próximo Ciclo (Aplicar Sugestões)
            </button>
        )}
      </div>

      {/* Área onde aparecem as sugestões da IA */}
      <div id="suggestions-section" className="mt-8">
          <ProgressTracker suggestions={suggestions} />
      </div>
    </div>
  );
};