import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile, TrainerStudent, TrainerWorkout } from '../types';
import { supabase } from '../supaBaseClient';
import { Onboarding } from './OnBoarding';
import { TrainerStudents } from './trainer/TrainerStudents';
import { TrainerWorkouts } from './trainer/TrainerWorkouts';
import { TrainerProfile } from './trainer/TrainerProfile';
import { UsersIcon, DumbbellIcon, UserIcon } from './icons';
import { getMyStudents, getTrainerWorkouts } from '../services/trainerService';

export const TrainerApp: React.FC<{ session: Session }> = ({ session }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [trainerWorkouts, setTrainerWorkouts] = useState<TrainerWorkout[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'workouts' | 'profile'>('students');

  const trainerId = session.user.id;
  const trainerName = profile?.name ?? session.user.user_metadata?.full_name ?? 'Professor';

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', trainerId)
        .single();
      if (data) {
        const name = session.user.user_metadata?.full_name as string | undefined;
        setProfile({ ...data, name });
      }
      setCheckingProfile(false);
    };
    load();
  }, [trainerId]);

  const refreshStudents = async () => {
    const data = await getMyStudents(trainerId);
    setStudents(data);
  };

  const refreshWorkouts = async () => {
    const data = await getTrainerWorkouts(trainerId);
    setTrainerWorkouts(data);
  };

  useEffect(() => {
    if (!checkingProfile && profile) {
      refreshStudents();
      refreshWorkouts();
    }
  }, [checkingProfile]);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return <Onboarding userId={trainerId} onComplete={() => window.location.reload()} />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'students' as const, Icon: UsersIcon,    label: 'Alunos'   },
    { key: 'workouts' as const, Icon: DumbbellIcon,  label: 'Treinos'  },
    { key: 'profile'  as const, Icon: UserIcon,      label: 'Perfil'   },
  ];

  return (
    <div className="min-h-screen bg-gray-900 pb-20 relative">
      <div className="max-w-md mx-auto pt-safe-top">
        {activeTab === 'students' && (
          <TrainerStudents
            trainerId={trainerId}
            trainerName={trainerName}
            students={students}
            trainerWorkouts={trainerWorkouts}
            onStudentsChange={refreshStudents}
          />
        )}
        {activeTab === 'workouts' && (
          <TrainerWorkouts
            trainerId={trainerId}
            trainerName={trainerName}
            workouts={trainerWorkouts}
            students={students}
            onWorkoutsChange={refreshWorkouts}
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
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.6)] pb-safe">
        <div className="h-16 flex justify-around items-center px-1">
          {tabs.map(({ key, Icon, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex flex-col items-center justify-center w-full h-full gap-0.5 relative transition-colors"
              >
                {isActive && (
                  <span className="absolute top-1.5 w-6 h-0.5 bg-emerald-500 rounded-full" />
                )}
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
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
