import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutPlanner } from './WorkoutPlanner';
import { Menu } from './Menu';
import { Workout, Suggestion } from '../types';
import { getWorkoutFromPDF } from '../services/geminiService';
import { supabase } from '../supaBaseClient';
import { Session } from '@supabase/supabase-js';
import { UploadIcon, DumbbellIcon, ClockIcon, HomeIcon, UserIcon, HistoryIcon, PlayIcon } from './icons';

export const MainApp: React.FC<{ session: Session }> = ({ session }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Timer e Estado do Treino
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Lógica do Timer
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

  // Carregar do Banco
  useEffect(() => {
    supabase.from('user_progress').select('*').eq('user_id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          const loadedWorkouts = (data.workouts || []).map((w: Workout) => ({
             ...w,
             exercises: w.exercises.map(e => ({ ...e, isFinished: e.isFinished || false }))
          }));
          setWorkouts(loadedWorkouts);
          setCompletedDates(data.completed_dates || []);
          setCurrentIdx(data.current_workout_index || 0);
        }
      });
  }, [session.user.id]);

  // Salvar no Banco
  useEffect(() => {
    if (workouts.length === 0) return;
    const t = setTimeout(async () => {
      setSaving(true);
      await supabase.from('user_progress').upsert({
        user_id: session.user.id,
        workouts,
        completed_dates: completedDates,
        current_workout_index: currentIdx,
        updated_at: new Date().toISOString()
      });
      setSaving(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [workouts, completedDates, currentIdx]);

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

  // Função chamada pelo WorkoutPlanner ao clicar em "Finalizar Treino"
  const handleWorkoutComplete = () => {
    setIsWorkoutRunning(false); // PARA O TIMER
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

  return (
    <div className="min-h-screen bg-gray-900 pb-20 relative">
      
      {importing && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-6"/>
              <h3 className="text-xl font-bold">Lendo PDF...</h3>
          </div>
      )}
      
      {/* Topo: Timer */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-center shadow-lg">
         <div className={`rounded-full px-6 py-1.5 flex items-center space-x-2 border transition-colors
             ${isWorkoutRunning ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
            <ClockIcon className="w-4 h-4" />
            <span className="font-mono font-bold tracking-wide">
                {isWorkoutRunning ? formatTime(seconds) : (seconds > 0 ? `Final: ${formatTime(seconds)}` : '0m 0s')}
            </span>
         </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-white text-lg flex items-center gap-2">
                <DumbbellIcon className="w-5 h-5 text-indigo-500"/> IronPath
            </h1>
            <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-500 hover:text-white">Sair</button>
        </div>

        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="bg-gray-800 p-6 rounded-full mb-6 border border-gray-700">
                  <UploadIcon className="w-8 h-8 text-indigo-400"/>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sem Treino</h2>
              <label className="bg-indigo-600 w-full py-3 rounded-xl font-bold text-white text-center shadow-lg mt-4 block">
                  Baixar Treino (PDF)
                  <input type="file" className="hidden" accept="application/pdf" onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])} />
              </label>
          </div>
        ) : (
          <>
            <Menu completedDates={completedDates} workouts={workouts} currentWorkoutIndex={currentIdx} onWorkoutSelect={setCurrentIdx} onFileImport={handleImport} />
            
            {/* TELA INICIAL DO TREINO (BOTÃO PLAY) */}
            {!isWorkoutRunning && seconds === 0 ? (
                <div className="mt-8 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-2">{workouts[currentIdx]?.name}</h2>
                        <p className="text-gray-400 mb-6">{workouts[currentIdx]?.exercises.length} exercícios</p>
                        
                        <button 
                            onClick={() => setIsWorkoutRunning(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl py-5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-3 transition-transform active:scale-95"
                        >
                            <PlayIcon className="w-8 h-8" />
                            <span>INICIAR TREINO</span>
                        </button>
                    </div>
                </div>
            ) : (
                <WorkoutPlanner 
                    workout={workouts[currentIdx]} 
                    onUpdateWeight={updateWeight} 
                    onToggleSet={toggleSet} 
                    onFinishExercise={handleFinishExercise}
                    onWorkoutComplete={handleWorkoutComplete} // Passa função que para o timer
                    onNewWorkout={applySuggestions}
                />
            )}
          </>
        )}
      </div>

      {/* Menu Inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 h-16 flex justify-around items-center z-50 safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
         <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-white active:bg-gray-800/50">
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Início</span>
         </button>
         <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-300 active:bg-gray-800/50">
            <HistoryIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Histórico</span>
         </button>
         <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-300 active:bg-gray-800/50">
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Perfil</span>
         </button>
      </div>

    </div>
  );
};