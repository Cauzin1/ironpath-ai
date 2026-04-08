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
    const { error } = await supabase.auth.signOut();
    if (error) {
      // signOut falhou — força reload para garantir limpeza local
      window.location.href = '/';
    }
    // Em caso de sucesso o onAuthStateChange em App.tsx recebe SIGNED_OUT
    // e redireciona para Login sem precisar de reload
  };

  const name = profile?.name ?? session.user.user_metadata?.full_name ?? session.user.email ?? 'Professor';
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const email = session.user.email ?? '';

  return (
    <div className="px-4 pt-6 pb-28 space-y-5 animate-fade-in">

      {/* Hero avatar */}
      <div className="flex flex-col items-center py-4">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-900/60">
            <span className="text-white text-3xl font-black">{initials || '?'}</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-900 border border-emerald-700/40 rounded-full whitespace-nowrap">
            <span className="text-emerald-400 text-[10px] font-bold tracking-wide">🎓 PROFESSOR</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-white mt-4">{name}</h2>
        <p className="text-gray-500 text-sm mt-0.5">{email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-4xl font-black text-white">{studentCount}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-emerald-500 text-sm">👥</span>
            <p className="text-gray-500 text-xs">Aluno{studentCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-4xl font-black text-white">{workoutCount}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-emerald-500 text-sm">📋</span>
            <p className="text-gray-500 text-xs">Programa{workoutCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-gray-600 text-lg">✉️</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs">Email da conta</p>
            <p className="text-white text-sm font-medium truncate">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-gray-600 text-lg">🎓</span>
          <div>
            <p className="text-gray-500 text-xs">Tipo de conta</p>
            <p className="text-white text-sm font-medium">Professor</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full py-4 rounded-2xl bg-gray-900 border border-gray-800 hover:border-red-900/50 hover:bg-red-900/10 text-gray-400 hover:text-red-400 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loggingOut ? (
          <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
        ) : (
          <>
            <span>→</span>
            Sair da Conta
          </>
        )}
      </button>
    </div>
  );
};
