import React from 'react';
import { UserProfile } from '../types';
import { DumbbellIcon, PlayIcon, UploadIcon, SparklesIcon, FlameIcon } from './icons';
import {
  calculateStreak,
  calculateXP,
  getLevel,
  getWeeklyCount,
  getAchievements,
  getMaxStreak,
} from '../utils/gamification';

interface HomeTabProps {
  userProfile: UserProfile;
  workoutName?: string;
  completedDates: string[];
  onStartWorkout: () => void;
  onImportFile: (file: File) => void;
  hasWorkout: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  userProfile,
  workoutName,
  completedDates,
  onStartWorkout,
  onImportFile,
  hasWorkout,
}) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const streak = calculateStreak(completedDates);
  const xp = calculateXP(completedDates);
  const { level, label: levelLabel, nextXP, currentXP } = getLevel(xp);
  const weeklyCount = getWeeklyCount(completedDates);
  const weeklyGoal = 4;
  const achievements = getAchievements(completedDates);

  const xpInLevel = xp - currentXP;
  const xpNeeded = nextXP - currentXP;
  const xpProgress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  return (
    <div className="p-5 space-y-5 animate-fade-in pb-28">

      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-center pt-1">
        <div>
          <p className="text-gray-400 text-sm">{greeting},</p>
          <h1 className="text-2xl font-black text-white">{userProfile.name ?? 'Atleta'}</h1>
        </div>
        <div className="flex items-center gap-2 bg-indigo-900/40 border border-indigo-500/30 px-3 py-1.5 rounded-full">
          <SparklesIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-200 text-sm font-bold">Nv {level} · {levelLabel}</span>
        </div>
      </div>

      {/* ── XP Progress ───────────────────────────────────────────── */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span className="font-semibold text-white">{xp} XP</span>
          <span>Próximo nível: {nextXP} XP</span>
        </div>
        <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">+100 XP por treino completado</p>
      </div>

      {/* ── Streak + Semanal ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-900/40 to-red-900/30 border border-orange-700/30 rounded-2xl p-4 flex flex-col items-center justify-center">
          <FlameIcon className="w-7 h-7 text-orange-400 mb-1" />
          <p className="text-4xl font-black text-white leading-none">{streak}</p>
          <p className="text-orange-300 text-xs mt-1 font-medium">
            {streak === 1 ? 'dia seguido' : 'dias seguidos'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Recorde: {getMaxStreak(completedDates)} dias</p>
        </div>

        {/* Meta semanal */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center">
          {/* Ring */}
          <div className="relative w-14 h-14 mb-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#374151" strokeWidth="5" />
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke={weeklyCount >= weeklyGoal ? '#10b981' : '#6366f1'}
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(weeklyCount / weeklyGoal, 1))}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
              {weeklyCount}/{weeklyGoal}
            </span>
          </div>
          <p className="text-gray-300 text-xs font-medium">Meta Semanal</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {weeklyCount >= weeklyGoal ? '✅ Concluída!' : `${weeklyGoal - weeklyCount} restantes`}
          </p>
        </div>
      </div>

      {/* ── Totais rápidos ────────────────────────────────────────── */}
      <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl px-4 py-3 flex justify-around">
        <div className="text-center">
          <p className="text-2xl font-black text-white">{completedDates.length}</p>
          <p className="text-[11px] text-gray-400">Total de treinos</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div className="text-center">
          <p className="text-2xl font-black text-white">{xp}</p>
          <p className="text-[11px] text-gray-400">XP acumulado</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div className="text-center">
          <p className="text-2xl font-black text-white">{level}</p>
          <p className="text-[11px] text-gray-400">Nível atual</p>
        </div>
      </div>

      {/* ── Botão principal ───────────────────────────────────────── */}
      {hasWorkout ? (
        <button
          onClick={onStartWorkout}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all rounded-2xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(99,102,241,0.35)]"
        >
          <div className="text-left">
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-0.5">Próximo treino</p>
            <p className="text-white font-black text-xl leading-tight">{workoutName ?? 'Treino'}</p>
          </div>
          <div className="bg-white/20 rounded-full p-3">
            <PlayIcon className="w-7 h-7 text-white" />
          </div>
        </button>
      ) : (
        <label className="w-full bg-gray-800 border-2 border-dashed border-gray-600 hover:border-indigo-500/60 hover:bg-gray-800/80 active:scale-95 transition-all rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer">
          <div className="bg-gray-700 p-3 rounded-full">
            <UploadIcon className="w-7 h-7 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Importar Ficha (PDF)</p>
            <p className="text-gray-400 text-sm mt-0.5">Envie seu plano de treino para começar</p>
          </div>
          <div className="bg-indigo-600/20 border border-indigo-500/30 px-4 py-1.5 rounded-full">
            <span className="text-indigo-300 text-sm font-medium">Selecionar arquivo</span>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImportFile(f); }}
          />
        </label>
      )}

      {/* ── Conquistas ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-white font-bold text-base">Conquistas</h2>
          <span className="text-gray-500 text-xs">
            {achievements.filter(a => a.unlocked).length}/{achievements.length} desbloqueadas
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map(a => {
            const pct = a.target > 0 ? Math.min((a.progress / a.target) * 100, 100) : 0;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  a.unlocked
                    ? 'bg-indigo-900/30 border-indigo-500/40'
                    : 'bg-gray-800/40 border-gray-700/40'
                }`}
              >
                <span className={`text-2xl flex-shrink-0 ${!a.unlocked ? 'grayscale opacity-50' : ''}`}>
                  {a.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold leading-tight truncate ${a.unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {a.label}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{a.description}</p>
                  {!a.unlocked && a.target > 1 && (
                    <div className="mt-1.5">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] text-gray-600">{a.progress}/{a.target}</span>
                      </div>
                      <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500/60 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {a.unlocked && (
                    <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">✓ Desbloqueada</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
