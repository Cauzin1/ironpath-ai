import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile, TrainerStudent, TrainerWorkout, AssignedWorkout, StudentProgress } from '../types';
import { supabase } from '../supaBaseClient';
import { TrainerStudents } from './trainer/TrainerStudents';
import { TrainerWorkouts } from './trainer/TrainerWorkouts';
import { TrainerProfile } from './trainer/TrainerProfile';
import { UsersIcon, DumbbellIcon, UserIcon } from './icons';
import {
  getMyStudents,
  getTrainerWorkouts,
  getAssignedWorkoutsForTrainer,
  getStudentsProgress,
} from '../services/trainerService';

export const TrainerApp: React.FC<{ session: Session }> = ({ session }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [trainerWorkouts, setTrainerWorkouts] = useState<TrainerWorkout[]>([]);
  const [trainerAssignments, setTrainerAssignments] = useState<AssignedWorkout[]>([]);
  const [studentsProgress, setStudentsProgress] = useState<Record<string, StudentProgress>>({});
  const [activeTab, setActiveTab] = useState<'students' | 'workouts' | 'profile'>('students');

  const trainerId = session.user.id;
  const trainerName = profile?.name ?? session.user.user_metadata?.full_name ?? 'Professor';
  const initials = trainerName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Carrega perfil do professor
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', trainerId).maybeSingle();
        if (error) throw error;
        if (data) {
          const name = session.user.user_metadata?.full_name as string | undefined;
          setProfile({ ...data, name });
        }
      } catch (e) {
        console.error('Erro ao carregar perfil do professor:', e);
      } finally {
        setCheckingProfile(false);
      }
    };
    load();
  }, [trainerId]);

  // Carrega alunos, treinos e atribuições em paralelo após o perfil
  useEffect(() => {
    if (checkingProfile) return;

    const loadAll = async () => {
      const [newStudents, newWorkouts, newAssignments] = await Promise.allSettled([
        getMyStudents(trainerId),
        getTrainerWorkouts(trainerId),
        getAssignedWorkoutsForTrainer(trainerId),
      ]);

      const resolvedStudents = newStudents.status === 'fulfilled' ? newStudents.value : [];
      const resolvedAssignments = newAssignments.status === 'fulfilled' ? newAssignments.value : [];

      if (newStudents.status === 'fulfilled') setStudents(resolvedStudents);
      if (newWorkouts.status === 'fulfilled') setTrainerWorkouts(newWorkouts.value);
      if (newAssignments.status === 'fulfilled') setTrainerAssignments(resolvedAssignments);

      // Progresso dos alunos calculado após ambas as listas estarem disponíveis
      if (resolvedStudents.length > 0) {
        const studentIds = resolvedStudents.map(s => s.student_id);
        getStudentsProgress(studentIds, resolvedAssignments)
          .then(setStudentsProgress)
          .catch(console.error);
      }
    };

    loadAll();
  }, [checkingProfile, trainerId]);

  const refreshStudents = async () => {
    try {
      const [newStudents, assignments] = await Promise.all([
        getMyStudents(trainerId),
        getAssignedWorkoutsForTrainer(trainerId),
      ]);
      setStudents(newStudents);
      setTrainerAssignments(assignments);
      if (newStudents.length > 0) {
        const ids = newStudents.map(s => s.student_id);
        getStudentsProgress(ids, assignments).then(setStudentsProgress).catch(console.error);
      } else {
        setStudentsProgress({});
      }
    } catch (e) { console.error(e); }
  };

  const refreshWorkouts = async () => {
    try { setTrainerWorkouts(await getTrainerWorkouts(trainerId)); }
    catch (e) { console.error(e); }
  };

  const refreshAssignments = async () => {
    try {
      const assignments = await getAssignedWorkoutsForTrainer(trainerId);
      setTrainerAssignments(assignments);
      if (students.length > 0) {
        const ids = students.map(s => s.student_id);
        getStudentsProgress(ids, assignments).then(setStudentsProgress).catch(console.error);
      }
    } catch (e) { console.error(e); }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const tabs = [
    { key: 'students' as const, Icon: UsersIcon,   label: 'Alunos'  },
    { key: 'workouts' as const, Icon: DumbbellIcon, label: 'Treinos' },
    { key: 'profile'  as const, Icon: UserIcon,     label: 'Perfil'  },
  ];

  const tabTitles: Record<string, string> = {
    students: 'Meus Alunos',
    workouts: 'Programas',
    profile: 'Meu Perfil',
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <span className="text-white text-xs font-black">{initials || '?'}</span>
          </div>
          <h1 className="text-white font-bold text-base">{tabTitles[activeTab]}</h1>
          <div className="px-2.5 py-1 bg-emerald-900/50 border border-emerald-700/40 rounded-full">
            <span className="text-emerald-400 text-[10px] font-bold tracking-wide">🎓 PROF</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto pt-14 pb-20">
        {activeTab === 'students' && (
          <TrainerStudents
            trainerId={trainerId}
            trainerName={trainerName}
            students={students}
            studentsProgress={studentsProgress}
            onStudentsChange={refreshStudents}
          />
        )}
        {activeTab === 'workouts' && (
          <TrainerWorkouts
            trainerId={trainerId}
            trainerName={trainerName}
            workouts={trainerWorkouts}
            students={students}
            assignments={trainerAssignments}
            onWorkoutsChange={refreshWorkouts}
            onSyncDone={refreshAssignments}
          />
        )}
        {activeTab === 'profile' && (
          <TrainerProfile
            session={session}
            profile={profile}
            studentCount={students.length}
            workoutCount={trainerWorkouts.length}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/60 pb-safe">
        <div className="max-w-md mx-auto h-16 flex items-center justify-around px-4">
          {tabs.map(({ key, Icon, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
              >
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-emerald-500/15' : ''}`}>
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
