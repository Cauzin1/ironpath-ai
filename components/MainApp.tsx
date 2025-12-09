import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutPlanner } from './WorkoutPlanner';
import { Menu } from './Menu';
import { Onboarding } from './OnBoarding';
import { Workout, Suggestion, UserProfile } from '../types';
import { getWorkoutFromPDF } from '../services/geminiService';
import { supabase } from '../supaBaseClient';
import { Session } from '@supabase/supabase-js';
import { UploadIcon, DumbbellIcon, ClockIcon, HomeIcon, UserIcon, HistoryIcon, PlayIcon } from './icons';

export const MainApp: React.FC<{ session: Session }> = ({ session }) => {
  // Dados do Treino
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  
  // Estado de UI e Perfil
  const [importing, setImporting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Estados do Timer e Execução
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // --- TIMER EFFECT ---
  useEffect(() => {
    let interval: any;
    if (isWorkoutRunning) {
      interval = setInterval(() => {
          setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorkoutRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // --- CARREGAMENTO INICIAL DE DADOS ---
  useEffect(() => {
    const loadUserData = async () => {
      // 1. Carregar Perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile) setUserProfile(profile);

      // 2. Carregar Treinos Salvos
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (progress) {
        const loadedWorkouts = (progress.workouts || []).map((w: Workout) => ({
           ...w,
           exercises: w.exercises.map(e => ({ ...e, isFinished: e.isFinished || false }))
        }));
        setWorkouts(loadedWorkouts);
        setCompletedDates(progress.completed_dates || []);
        setCurrentIdx(progress.current_workout_index || 0);
      }
      
      setCheckingProfile(false);
    };

    loadUserData();
  }, [session.user.id]);

  // --- SALVAMENTO AUTOMÁTICO (Debounce) ---
  useEffect(() => {
    if (workouts.length === 0) return;
    const t = setTimeout(async () => {
      await supabase.from('user_progress').upsert({
        user_id: session.user.id,
        workouts,
        completed_dates: completedDates,
        current_workout_index: currentIdx,
        updated_at: new Date().toISOString()
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [workouts, completedDates, currentIdx]);

  // --- HANDLERS ---

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
         const b64 = (reader.result as string).split(',')[1];
         const newW = await getWorkoutFromPDF(b64);
         setWorkouts(newW);
         setCurrentIdx(0);
         setSeconds(0);
         setIsWorkoutRunning(false);
         await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            workouts: newW,
            completed_dates: completedDates,
            current_workout_index: 0
         });
         setImporting(false);
      }
    } catch (e) { alert("Erro ao importar"); setImporting(false); }
  };

  const updateWeight = useCallback((id: number, w: number) => {
    setWorkouts(prev => {
        const copy = [...prev];
        copy[currentIdx].exercises = copy[currentIdx].exercises.map(e => e.id === id ? {...e, currentWeight: w} : e);
        return copy;
    });
  }, [currentIdx]);

  const toggleSet = useCallback((id: number, s: number) => {
    setWorkouts(prev => {
        const copy = [...prev];
        copy[currentIdx].exercises = copy[currentIdx].exercises.map(e => {
            if (e.id === id) {
                const completed = e.completedSets.includes(s) 
                    ? e.completedSets.filter(x => x !== s) 
                    : [...e.completedSets, s];
                completed.sort((a,b) => a-b);
                return {...e, completedSets: completed};
            }
            return e;
        });
        return copy;
    });
  }, [currentIdx]);

  const handleFinishExercise = useCallback((id: number) => {
    setWorkouts(prev => {
        const copy = [...prev];
        copy[currentIdx].exercises = copy[currentIdx].exercises.map(e => {
            if (e.id === id) return { ...e, isFinished: !e.isFinished };
            return e;
        });
        return copy;
    });
  }, [currentIdx]);

  const handleWorkoutComplete = () => {
    setIsWorkoutRunning(false); // Para o timer
    setCompletedDates(p => [...p, new Date().toISOString().split('T')[0]]);
  };

  const applySuggestions = useCallback((sugs: Suggestion[]) => {
      setWorkouts(prev => {
          const copy = [...prev];
          copy[currentIdx].exercises = copy[currentIdx].exercises.map(e => {
              const sug = sugs.find(s => s.exerciseId === e.id);
              return {
                  ...e,
                  currentWeight: sug ? sug.suggestedWeight : e.currentWeight,
                  completedSets: [],
                  isFinished: false,
                  history: [...e.history, { date: new Date().toISOString(), weight: e.currentWeight, reps: e.reps }]
              };
          });
          return copy;
      });
      setSeconds(0);
      setIsWorkoutRunning(false);
  }, [currentIdx]);


  // --- RENDERIZAÇÃO CONDICIONAL ---

  // 1. Loading Inicial
  if (checkingProfile) {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
            <p>Carregando perfil...</p>
        </div>
    );
  }

  // 2. Se não tem perfil, mostra Onboarding
  if (!userProfile) {
    return <Onboarding userId={session.user.id} onComplete={() => window.location.reload()} />;
  }

  // 3. App Principal
  return (
    <div className="min-h-screen bg-gray-900 pb-24 relative">
      
      {/* Overlay de Importação */}
      {importing && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-6"/>
              <h3 className="text-xl font-bold">Lendo PDF...</h3>
              <p className="text-gray-400 mt-2">A IA está analisando seu treino.</p>
          </div>
      )}
      
      {/* Barra de Timer Fixa */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 pt-safe-top pb-3 flex items-center justify-center shadow-lg">
         <div className={`rounded-full px-6 py-1.5 flex items-center space-x-2 border transition-colors
             ${isWorkoutRunning ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
            <ClockIcon className="w-4 h-4" />
            <span className="font-mono font-bold tracking-wide">
                {isWorkoutRunning ? formatTime(seconds) : (seconds > 0 ? `Final: ${formatTime(seconds)}` : '0m 0s')}
            </span>
         </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Header App */}
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-white text-lg flex items-center gap-2">
                <DumbbellIcon className="w-5 h-5 text-indigo-500"/> IronPath
            </h1>
            <div className="flex items-center gap-3">
               <span className="text-[10px] bg-gray-800 border border-gray-700 px-2 py-1 rounded text-gray-400 capitalize">
                   {userProfile.experience_level}
               </span>
               <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-500 hover:text-white">Sair</button>
            </div>
        </div>

        {workouts.length === 0 ? (
          // Tela Sem Treino
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="bg-gray-800 p-6 rounded-full mb-6 border border-gray-700 shadow-xl">
                  <UploadIcon className="w-8 h-8 text-indigo-400"/>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sem Treino</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Importe seu PDF para que a IA monte sua ficha personalizada.</p>
              
              <label className="bg-indigo-600 active:bg-indigo-700 transition-colors w-full py-4 rounded-xl font-bold text-white text-center shadow-lg block cursor-pointer">
                  Selecionar PDF
                  <input type="file" className="hidden" accept="application/pdf" onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])} />
              </label>
          </div>
        ) : (
          // Tela Com Treino
          <>
            <Menu completedDates={completedDates} workouts={workouts} currentWorkoutIndex={currentIdx} onWorkoutSelect={setCurrentIdx} onFileImport={handleImport} />
            
            {/* Se timer zerado e parado -> Mostrar Botão Gigante de Iniciar */}
            {!isWorkoutRunning && seconds === 0 ? (
                <div className="mt-10 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-2">{workouts[currentIdx]?.name}</h2>
                        <p className="text-gray-400 mb-8">{workouts[currentIdx]?.exercises.length} exercícios preparados</p>
                        
                        <button 
                            onClick={() => setIsWorkoutRunning(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl py-6 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-3 transition-transform active:scale-95"
                        >
                            <PlayIcon className="w-8 h-8" />
                            <span>INICIAR TREINO</span>
                        </button>
                    </div>
                </div>
            ) : (
                // Se rodando -> Mostrar Planner
                <WorkoutPlanner 
                    workout={workouts[currentIdx]} 
                    userProfile={userProfile} // Passando o perfil para a IA
                    onUpdateWeight={updateWeight} 
                    onToggleSet={toggleSet} 
                    onFinishExercise={handleFinishExercise}
                    onWorkoutComplete={handleWorkoutComplete}
                    onNewWorkout={applySuggestions}
                />
            )}
          </>
        )}
      </div>

      {/* Menu Inferior Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 h-20 pb-safe-bottom flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
         <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-white active:bg-gray-800/50 transition-colors">
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Início</span>
         </button>
         <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-300 active:bg-gray-800/50 transition-colors">
            <HistoryIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Histórico</span>
         </button>
         <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-300 active:bg-gray-800/50 transition-colors">
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1">Perfil</span>
         </button>
      </div>

    </div>
  );
};