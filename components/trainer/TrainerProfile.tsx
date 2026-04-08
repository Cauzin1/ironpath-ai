import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supaBaseClient';

interface TrainerProfileProps {
  session: Session;
  profile: UserProfile | null;
  studentCount: number;
  workoutCount: number;
}

export const TrainerProfile: React.FC<TrainerProfileProps> = ({
  session,
  profile,
  studentCount,
  workoutCount,
}) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      setLoggingOut(false);
    }
  };

  const name = profile?.name ?? session.user.user_metadata?.full_name ?? session.user.email ?? 'Professor';
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      {/* Avatar + info */}
      <div className="flex flex-col items-center mt-6">
        <div className="w-24 h-24 rounded-full border-4 border-emerald-700/40 shadow-2xl bg-emerald-900/20 flex items-center justify-center">
          <span className="text-3xl font-black text-emerald-300">{initials}</span>
        </div>
        <div className="mt-2 px-3 py-1 bg-emerald-900/30 border border-emerald-700/30 rounded-full">
          <span className="text-emerald-400 text-xs font-bold">🎓 Professor</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-3">{name}</h2>
        <p className="text-gray-500 text-sm">{session.user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-900/20 border border-emerald-700/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-white">{studentCount}</p>
          <p className="text-emerald-400 text-xs mt-1">Aluno{studentCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-white">{workoutCount}</p>
          <p className="text-gray-400 text-xs mt-1">Programa{workoutCount !== 1 ? 's' : ''} criado{workoutCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-red-900/20 border border-red-900/50 text-red-400 font-bold py-4 rounded-xl hover:bg-red-900/40 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        {loggingOut ? 'Saindo...' : 'Sair da Conta'}
      </button>
    </div>
  );
};
