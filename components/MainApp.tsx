import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutPlanner } from './WorkoutPlanner';
import { Onboarding } from './OnBoarding';
import { HomeTab } from './HomeTab';
import { ProfileTab } from './ProfileTab';
import { WorkoutsTab } from './WorkoutsTab';
import WebDashboard from './WebDashboard';
import { Workout, Suggestion, UserProfile, AssignedWorkout, TrainerStudent } from '../types';
import { getWorkoutFromPDF } from '../services/geminiService';
import { supabase } from '../supaBaseClient';
import {
  getAssignedWorkoutsForStudent,
  activateAssignedWorkout,
  getMyTrainer,
  joinByInviteCode,
  leaveTrainer,
} from '../services/trainerService';
import { Session } from '@supabase/supabase-js';
import { useWorkoutReminder } from '../hooks/useWorkoutReminder';
import {
  DumbbellIcon,
  ClockIcon,
  HomeIcon,
  UserIcon,
  ChartBarIcon,
  ClipboardListIcon,
  UploadIcon,
} from './icons';

// Parte principal do nome (antes do " - " ou " – ")
const getWorkoutTabMain = (name: string): string => {
  const dashIdx = name.search(/\s[-–]\s/);
  const base = dashIdx > 0 ? name.substring(0, dashIdx).trim() : name.trim();
  return base.length > 14 ? base.substring(0, 13) + '…' : base;
};

// Grupo muscular (depois do " - "), apenas o primeiro grupo
const getWorkoutTabSub = (name: string): string => {
  const match = name.match(/\s[-–]\s(.+)/);
  if (!match) return '';
  const muscles = match[1].split(/\s+e\s+/i)[0].trim();
  return muscles.length > 12 ? muscles.substring(0, 11) + '…' : muscles;
};

export const MainApp: React.FC<{ session: Session }> = ({ session }) => {
  // Dados
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  
  // UI & Navegação
  const [activeTab, setActiveTab] = useState<'home' | 'workout' | 'plans' | 'profile' | 'dashboard'>('home');
  const [importing, setImporting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Timer
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Import error banner
  const [importError, setImportError] = useState<string | null>(null);

  // Trainer/assigned workouts
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkout[]>([]);
  const [trainerLink, setTrainerLink] = useState<TrainerStudent | null>(null);

  // Workout reminders
  const workoutReminder = useWorkoutReminder(completedDates);

  // Estado de análise da IA (persiste quando usuário muda de aba)
  const [workoutAnalyzing, setWorkoutAnalyzing] = useState(false);

  // Local date helper (avoids UTC offset issues)
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

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
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
        if (profile) {
          const name = session.user.user_metadata?.full_name as string | undefined;
          setUserProfile({ ...profile, name });
        }

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

        // Tabelas do sistema professor/aluno podem não existir — nunca bloquear o carregamento
        const [assigned, trainer] = await Promise.all([
          getAssignedWorkoutsForStudent(session.user.id).catch(() => [] as AssignedWorkout[]),
          getMyTrainer(session.user.id).catch(() => null),
        ]);
        setAssignedWorkouts(assigned);
        setTrainerLink(trainer);
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      } finally {
        setCheckingProfile(false);
      }
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
  const handleImport = async (file: File, mode: 'replace' | 'append' = 'replace') => {
    setImporting(true);
    setImportError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const b64 = (reader.result as string).split(',')[1];
          const newW = await getWorkoutFromPDF(b64);

          let finalWorkouts: Workout[];
          let finalIdx: number;

          if (mode === 'append' && workouts.length > 0) {
            // Re-atribui IDs para evitar conflitos
            const maxId = workouts.reduce(
              (max, w) => w.exercises.reduce((m, e) => Math.max(m, e.id), max), 0
            );
            let idCounter = maxId + 1;
            const renumbered = newW.map(w => ({
              ...w,
              exercises: w.exercises.map(ex => ({ ...ex, id: idCounter++ })),
            }));
            finalWorkouts = [...workouts, ...renumbered];
            finalIdx = currentIdx;
          } else {
            finalWorkouts = newW;
            finalIdx = 0;
            setSeconds(0);
            setIsWorkoutRunning(false);
            setActiveTab('plans');
          }

          setWorkouts(finalWorkouts);
          setCurrentIdx(finalIdx);

          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            workouts: finalWorkouts,
            completed_dates: completedDates,
            current_workout_index: finalIdx,
          });
        } catch (innerErr: any) {
          const msg = innerErr?.message ?? 'Erro desconhecido.';
          console.error('Erro ao processar PDF:', msg);
          setImportError(msg);
        } finally {
          setImporting(false);
        }
      };
      reader.onerror = () => {
        setImportError('Não foi possível ler o PDF. Verifique se é um arquivo válido.');
        setImporting(false);
      };
    } catch (e) {
      setImportError('Não foi possível ler o PDF. Verifique se é um arquivo válido.');
      setImporting(false);
    }
  };

  // Funções de Treino
  const updateWeight = useCallback((id: number, w: number) => {
    setWorkouts(prev => {
        const copy = [...prev];
        const idx = Math.min(currentIdx, copy.length - 1);
        copy[idx].exercises = copy[idx].exercises.map(e => e.id === id ? {...e, currentWeight: w} : e);
        return copy;
    });
  }, [currentIdx]);

  const toggleSet = useCallback((id: number, s: number) => {
    setWorkouts(prev => {
        const copy = [...prev];
        const idx = Math.min(currentIdx, copy.length - 1);
        copy[idx].exercises = copy[idx].exercises.map(e => {
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
        const idx = Math.min(currentIdx, copy.length - 1);
        copy[idx].exercises = copy[idx].exercises.map(e => {
            if (e.id === id) return { ...e, isFinished: !e.isFinished };
            return e;
        });
        return copy;
    });
  }, [currentIdx]);

  const updateRpe = useCallback((id: number, rpe: number) => {
    setWorkouts(prev => {
        const copy = [...prev];
        const idx = Math.min(currentIdx, copy.length - 1);
        copy[idx].exercises = copy[idx].exercises.map(e =>
            e.id === id ? { ...e, rpe } : e
        );
        return copy;
    });
  }, [currentIdx]);

  const handleWorkoutComplete = () => {
    setIsWorkoutRunning(false);
    const today = getLocalDateString();
    setCompletedDates(p => p.includes(today) ? p : [...p, today]);
    // Registra qual treino foi feito hoje
    setWorkouts(prev => {
      const copy = [...prev];
      const idx = Math.min(currentIdx, copy.length - 1);
      copy[idx] = { ...copy[idx], lastPerformedDate: today };
      return copy;
    });
  };

  const handleDeleteWorkout = useCallback((index: number) => {
    setWorkouts(prev => {
      const copy = prev.filter((_, i) => i !== index);
      return copy;
    });
    setCurrentIdx(prev => {
      if (index < prev) return prev - 1;
      return Math.max(0, Math.min(prev, workouts.length - 2));
    });
  }, [workouts.length]);

  const applySuggestions = useCallback((sugs: Suggestion[]) => {
      setWorkouts(prev => {
          const copy = [...prev];
          const idx = Math.min(currentIdx, copy.length - 1);
          copy[idx].exercises = copy[idx].exercises.map(e => {
              const sug = sugs.find(s => s.exerciseId === e.id);
              return {
                  ...e,
                  currentWeight: sug ? sug.suggestedWeight : e.currentWeight,
                  completedSets: [],
                  isFinished: false,
                  rpe: undefined,
                  history: [
                      ...e.history,
                      {
                          date: getLocalDateString(),
                          weight: e.currentWeight,
                          reps: e.reps,
                          rpe: e.rpe,
                      }
                  ]
              };
          });
          return copy;
      });
      setSeconds(0);
      setIsWorkoutRunning(false);
  }, [currentIdx]);

  const handleActivateAssignment = async (assignment: AssignedWorkout) => {
    await activateAssignedWorkout(assignment, session.user.id, completedDates);
    setWorkouts(assignment.workouts);
    setCurrentIdx(0);
    setSeconds(0);
    setIsWorkoutRunning(false);
    const refreshed = await getAssignedWorkoutsForStudent(session.user.id);
    setAssignedWorkouts(refreshed);
    setActiveTab('plans');
  };

  const handleJoinTrainer = async (code: string) => {
    const studentName = userProfile?.name ?? session.user.user_metadata?.full_name ?? 'Aluno';
    await joinByInviteCode(code, session.user.id, studentName);
    const trainer = await getMyTrainer(session.user.id);
    setTrainerLink(trainer);
    const assigned = await getAssignedWorkoutsForStudent(session.user.id);
    setAssignedWorkouts(assigned);
  };

  const handleLeaveTrainer = async () => {
    if (!trainerLink) return;
    await leaveTrainer(session.user.id);
    setTrainerLink(null);
    setAssignedWorkouts([]);
  };

  // Navega para aba Treino e auto-inicia o timer se ainda não rodando
  const goToWorkout = () => {
    setActiveTab('workout');
    if (!isWorkoutRunning && seconds === 0 && workouts.length > 0) {
      setIsWorkoutRunning(true);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (checkingProfile) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  if (!userProfile) return <Onboarding userId={session.user.id} initialRole={session.user.user_metadata?.selectedRole} onComplete={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-gray-900 pb-20 pb-safe relative">
      {/* Loading Overlay */}
      {importing && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-6"/>
              <h3 className="text-xl font-bold">Lendo PDF...</h3>
              <p className="text-gray-400 text-sm mt-2">Pode levar alguns segundos</p>
          </div>
      )}

      {/* Banner: IA analisando em background */}
      {workoutAnalyzing && activeTab !== 'workout' && (
          <div className="fixed top-4 left-4 right-4 z-50 flex items-center gap-3 bg-indigo-900/95 border border-indigo-500/60 rounded-xl px-4 py-3 shadow-xl backdrop-blur">
              <div className="w-4 h-4 border-2 border-indigo-300/40 border-t-indigo-300 rounded-full animate-spin flex-shrink-0" />
              <p className="text-indigo-200 text-sm font-medium flex-1">IA analisando seu treino...</p>
              <button
                  onClick={() => setActiveTab('workout')}
                  className="text-indigo-400 text-xs font-bold hover:text-white transition-colors whitespace-nowrap"
              >
                  Ver →
              </button>
          </div>
      )}

      {/* Error Toast (global, visible in any tab) */}
      {importError && (
          <div className="fixed top-4 left-4 right-4 z-50 flex items-start justify-between bg-red-900/90 border border-red-700/60 rounded-xl p-4 shadow-xl backdrop-blur">
              <p className="text-red-200 text-sm font-medium flex-1 leading-snug">{importError}</p>
              <button
                  onClick={() => setImportError(null)}
                  className="ml-3 text-red-400 hover:text-white text-xl leading-none font-bold flex-shrink-0"
                  aria-label="Fechar"
              >×</button>
          </div>
      )}

      {/* RENDERIZAÇÃO DAS TELAS (TABS) */}
      <div className="max-w-md mx-auto pt-safe-top">
        
        {/* ABA: HOME (INÍCIO) */}
        {activeTab === 'home' && (
            <HomeTab
                userProfile={userProfile}
                workoutName={workouts[currentIdx]?.name}
                completedDates={completedDates}
                onStartWorkout={goToWorkout}
                onImportFile={(file) => handleImport(file)}
                hasWorkout={workouts.length > 0}
            />
        )}

        {/* ABA: TREINO (WORKOUT) — sempre montada para preservar estado de loading/sugestões */}
        <div className={activeTab === 'workout' ? '' : 'hidden'}>
            <>
                {/* Header fixo: seletor de dias + timer */}
                <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-lg">
                    {workouts.length > 0 ? (() => {
                        const safeIdx = Math.min(currentIdx, workouts.length - 1);
                        const doneCount = workouts[safeIdx].exercises.filter(e => e.isFinished).length;
                        const total = workouts[safeIdx].exercises.length;
                        return (
                            <>
                                {/* Linha: título + botão gerenciar */}
                                <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Selecione o dia</p>
                                        <p className="text-white font-bold text-sm leading-tight truncate max-w-[200px]">
                                            {workouts[safeIdx].name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {doneCount > 0 && (
                                            <span className="text-green-400 text-xs font-bold bg-green-900/30 px-2.5 py-1 rounded-full">
                                                {doneCount}/{total}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setActiveTab('plans')}
                                            className="text-xs text-gray-400 hover:text-white bg-gray-800 border border-gray-700 px-3 py-2.5 rounded-lg transition-colors min-h-[36px]"
                                        >
                                            Gerenciar
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs dos dias do programa */}
                                <div className="flex overflow-x-auto px-4 pb-2 gap-2 scrollbar-hide">
                                    {workouts.map((w, idx) => {
                                        const isActive = safeIdx === idx;
                                        const doneInThis = w.exercises.filter(e => e.isFinished).length;
                                        const allDone = doneInThis === w.exercises.length && w.exercises.length > 0;
                                        const mainLabel = getWorkoutTabMain(w.name);
                                        const subLabel = getWorkoutTabSub(w.name);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIdx(idx)}
                                                className={`flex-shrink-0 flex flex-col items-start px-3 py-2 rounded-xl text-left transition-all border min-w-[90px] ${
                                                    isActive
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/40'
                                                        : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                                                }`}
                                            >
                                                <span className="text-xs font-bold leading-tight">{mainLabel}</span>
                                                {subLabel ? (
                                                    <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                        {subLabel}
                                                    </span>
                                                ) : allDone ? (
                                                    <span className="text-[10px] text-green-400 mt-0.5">✓ Feito</span>
                                                ) : null}
                                                {subLabel && allDone && (
                                                    <span className={`text-[10px] mt-0.5 ${isActive ? 'text-green-300' : 'text-green-500'}`}>✓ Feito</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Timer */}
                                <div className="px-4 pb-2.5 flex justify-center">
                                    <div className={`rounded-full px-5 py-1.5 flex items-center gap-2 border transition-colors text-sm ${
                                        isWorkoutRunning
                                            ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200'
                                            : 'bg-gray-800 border-gray-700 text-gray-400'
                                    }`}>
                                        <ClockIcon className="w-4 h-4" />
                                        <span className="font-mono font-bold tracking-wide">
                                            {isWorkoutRunning ? formatTime(seconds) : (seconds > 0 ? `Final: ${formatTime(seconds)}` : '0m 0s')}
                                        </span>
                                        {!isWorkoutRunning && seconds === 0 && (
                                            <button
                                                onClick={() => setIsWorkoutRunning(true)}
                                                className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors ml-1"
                                            >
                                                ▶ Iniciar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })() : (
                        <div className="px-4 py-3 flex justify-center">
                            <div className="bg-gray-800 border border-gray-700 text-gray-500 rounded-full px-5 py-1.5 flex items-center gap-2 text-sm">
                                <ClockIcon className="w-4 h-4" />
                                <span className="font-mono font-bold">0m 0s</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    {workouts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
                            <div className="bg-gray-800 p-5 rounded-full">
                                <DumbbellIcon className="w-10 h-10 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">Nenhum programa carregado</p>
                                <p className="text-gray-400 text-sm mt-1">Importe sua ficha de treino em PDF para começar</p>
                            </div>
                            <label className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2">
                                <UploadIcon className="w-5 h-5" />
                                Importar PDF
                                <input type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f, 'append'); }} />
                            </label>
                        </div>
                    ) : (
                        <WorkoutPlanner
                            key={Math.min(currentIdx, workouts.length - 1)}
                            workout={workouts[Math.min(currentIdx, workouts.length - 1)]}
                            userProfile={userProfile}
                            onUpdateWeight={updateWeight}
                            onToggleSet={toggleSet}
                            onFinishExercise={handleFinishExercise}
                            onRpeChange={updateRpe}
                            onWorkoutComplete={handleWorkoutComplete}
                            onNewWorkout={applySuggestions}
                            onLoadingChange={setWorkoutAnalyzing}
                        />
                    )}
                </div>
            </>
        </div>

        {/* ABA: PLANOS (MEUS TREINOS) */}
        {activeTab === 'plans' && (
            <WorkoutsTab
                workouts={workouts}
                currentWorkoutIndex={workouts.length > 0 ? Math.min(currentIdx, workouts.length - 1) : 0}
                onImport={handleImport}
                onSelectAndGo={(index) => {
                    setCurrentIdx(index);
                    goToWorkout();
                }}
                onDeleteWorkout={handleDeleteWorkout}
                assignedWorkouts={assignedWorkouts}
                onActivateAssignment={handleActivateAssignment}
            />
        )}

        {/* ABA: DASHBOARD (PROGRESSO) */}
        {activeTab === 'dashboard' && (
            <WebDashboard workouts={workouts} completedDates={completedDates} />
        )}

        {/* ABA: PERFIL */}
        {activeTab === 'profile' && (
            <ProfileTab
                profile={userProfile}
                email={session.user.email}
                userId={session.user.id}
                onAvatarUpdate={(url) => setUserProfile(prev => prev ? { ...prev, avatar_url: url } : prev)}
                onProfileUpdate={(p) => setUserProfile(p)}
                onLogout={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                }}
                notifications={workoutReminder}
                trainerLink={trainerLink}
                onJoinTrainer={handleJoinTrainer}
                onLeaveTrainer={handleLeaveTrainer}
            />
        )}

      </div>

      {/* MENU INFERIOR (NAVEGAÇÃO) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.6)] pb-safe">
        <div className="h-16 flex justify-around items-center px-1">
          {(
            [
              { tab: 'home'      as const, Icon: HomeIcon,          label: 'Início'    },
              { tab: 'workout'   as const, Icon: DumbbellIcon,      label: 'Treino'    },
              { tab: 'plans'     as const, Icon: ClipboardListIcon, label: 'Planos'    },
              { tab: 'dashboard' as const, Icon: ChartBarIcon,      label: 'Progresso' },
              { tab: 'profile'   as const, Icon: UserIcon,          label: 'Perfil'    },
            ]
          ).map(({ tab, Icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => tab === 'workout' ? goToWorkout() : setActiveTab(tab)}
                className="flex flex-col items-center justify-center w-full h-full gap-0.5 relative transition-colors"
              >
                {isActive && (
                  <span className="absolute top-1.5 w-6 h-0.5 bg-indigo-500 rounded-full" />
                )}
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};