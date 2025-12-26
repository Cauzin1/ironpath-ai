import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutPlanner } from './WorkoutPlanner';
import { Menu } from './Menu';
import { Onboarding } from './OnBoarding';
import { HomeTab } from './HomeTab';
import { ProfileTab } from './ProfileTab';
import WebDashboard from './WebDashboard'; // CORREÇÃO: Importar WebDashboard
import { Workout, Suggestion, UserProfile } from '../types';
import { getWorkoutFromPDF } from '../services/geminiService';
import { supabase } from '../supaBaseClient';
import { Session } from '@supabase/supabase-js';
import { 
  UploadIcon, 
  DumbbellIcon, 
  ClockIcon, 
  HomeIcon, 
  UserIcon, 
  HistoryIcon,
  ChartBarIcon
} from './icons';

export const MainApp: React.FC<{ session: Session }> = ({ session }) => {
  // Dados
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  
  // UI & Navegação
  const [activeTab, setActiveTab] = useState<'home' | 'workout' | 'history' | 'profile' | 'dashboard'>('home');
  const [importing, setImporting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Timer
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isWorkoutRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Carregar Dados
  useEffect(() => {
    const loadData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      if (profile) setUserProfile(profile);

      const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', session.user.id).single();
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
    loadData();
  }, [session.user.id]);

  // Salvar Dados
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

  // Handlers
  const handleImport = async (file?: File) => {
    if (!file) {
        document.getElementById('hidden-file-input')?.click();
        return;
    }

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
         setActiveTab('workout');
         
         await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            workouts: newW,
            completed_dates: completedDates,
            current_workout_index: 0
         });
         setImporting(false);
      }
    } catch (e) { 
      alert("Erro ao importar"); 
      setImporting(false); 
    }
  };

  // Funções de Treino
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
    setIsWorkoutRunning(false);
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

  // Input file escondido para o menu Home
  const HiddenInput = () => (
    <input 
        id="hidden-file-input"
        type="file" 
        className="hidden" 
        accept="application/pdf" 
        onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])} 
    />
  );

  // --- RENDERIZAÇÃO ---

  if (checkingProfile) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  if (!userProfile) return <Onboarding userId={session.user.id} onComplete={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-gray-900 pb-20 relative">
      <HiddenInput />
      
      {/* Loading Overlay */}
      {importing && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-6"/>
              <h3 className="text-xl font-bold">Lendo PDF...</h3>
          </div>
      )}

      {/* RENDERIZAÇÃO DAS TELAS (TABS) */}
      <div className="max-w-md mx-auto pt-safe-top">
        
        {/* ABA: HOME (INÍCIO) */}
        {activeTab === 'home' && (
            <HomeTab 
                userProfile={userProfile}
                workoutName={workouts[currentIdx]?.name}
                completedCount={completedDates.length}
                onStartWorkout={() => {
                    setActiveTab('workout');
                    if(seconds === 0 && !isWorkoutRunning) setIsWorkoutRunning(true);
                }}
                onImportClick={() => handleImport()}
                hasWorkout={workouts.length > 0}
                onGoToDiet={() => {}}
                onAddMeal={() => {}}
            />
        )}

        {/* ABA: TREINO (WORKOUT) */}
        {activeTab === 'workout' && (
            <>
                {/* Timer (Só aparece na aba de treino) */}
                <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 pb-3 pt-2 flex items-center justify-center shadow-lg">
                    <div className={`rounded-full px-6 py-1.5 flex items-center space-x-2 border transition-colors
                        ${isWorkoutRunning ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                        <ClockIcon className="w-4 h-4" />
                        <span className="font-mono font-bold tracking-wide">
                            {isWorkoutRunning ? formatTime(seconds) : (seconds > 0 ? `Final: ${formatTime(seconds)}` : '0m 0s')}
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    {workouts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                            <p className="text-gray-400 mb-4">Nenhum treino carregado.</p>
                            <button onClick={() => handleImport()} className="bg-indigo-600 px-6 py-3 rounded-xl text-white font-bold">Importar PDF</button>
                        </div>
                    ) : (
                        <>
                            <Menu completedDates={completedDates} workouts={workouts} currentWorkoutIndex={currentIdx} onWorkoutSelect={setCurrentIdx} onFileImport={(f) => handleImport(f)} />
                            <WorkoutPlanner 
                                workout={workouts[currentIdx]} 
                                userProfile={userProfile}
                                onUpdateWeight={updateWeight} 
                                onToggleSet={toggleSet} 
                                onFinishExercise={handleFinishExercise}
                                onWorkoutComplete={handleWorkoutComplete}
                                onNewWorkout={applySuggestions}
                            />
                        </>
                    )}
                </div>
            </>
        )}

        {/* ABA: DASHBOARD (PROGRESSO) */}
        {activeTab === 'dashboard' && (
            <div className="p-4">
                <WebDashboard userId={session.user.id} /> {/* CORREÇÃO: Usar WebDashboard */}
            </div>
        )}

        {/* ABA: PERFIL */}
        {activeTab === 'profile' && (
            <ProfileTab 
                profile={userProfile} 
                email={session.user.email} 
                onLogout={() => supabase.auth.signOut()} 
            />
        )}

        {/* Placeholder para Histórico */}
        {activeTab === 'history' && (
            <div className="p-6 text-center text-gray-500 mt-20">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                <p>Histórico detalhado em breve.</p>
                <p className="text-xs mt-2">Total de treinos: {completedDates.length}</p>
            </div>
        )}

      </div>

      {/* MENU INFERIOR (NAVEGAÇÃO) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 h-20 pb-safe-bottom flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
         <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-gray-500'}`}
         >
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Início</span>
         </button>
         
         <button 
            onClick={() => setActiveTab('workout')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'workout' ? 'text-indigo-400' : 'text-gray-500'}`}
         >
            <DumbbellIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Treino</span>
         </button>

         <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-gray-500'}`}
         >
            <ChartBarIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Progresso</span>
         </button>

         <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'history' ? 'text-white' : 'text-gray-500'}`}
         >
            <HistoryIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Histórico</span>
         </button>
         
         <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-gray-500'}`}
         >
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Perfil</span>
         </button>
      </div>
    </div>
  );
};