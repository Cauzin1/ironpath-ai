import React, { useMemo } from 'react';
import { Workout } from '../types';
import { calculateStreak, getWeeklyCount, getMaxStreak } from '../utils/gamification';

interface WebDashboardProps {
  workouts: Workout[];
  completedDates: string[];
}

function getLocalDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

const WebDashboard: React.FC<WebDashboardProps> = ({ workouts, completedDates }) => {
  const dateSet = useMemo(() => new Set(completedDates), [completedDates]);

  // ── Quick stats ────────────────────────────────────────────────────────
  const totalWorkouts = completedDates.length;
  const streak = calculateStreak(completedDates);
  const maxStreak = getMaxStreak(completedDates);
  const weeklyCount = getWeeklyCount(completedDates);

  // ── Last 30 days activity grid ─────────────────────────────────────────
  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const iso = getLocalDate(-(29 - i));
      return { iso, done: dateSet.has(iso) };
    });
  }, [dateSet]);

  // ── Last 8 weeks workout count ─────────────────────────────────────────
  const weeklyBars = useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const monday = new Date();
      const day = monday.getDay();
      monday.setDate(monday.getDate() - ((day + 6) % 7) - w * 7);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const count = completedDates.filter(d => {
        const dt = new Date(d + 'T00:00:00');
        return dt >= monday && dt <= sunday;
      }).length;

      const mm = String(monday.getMonth() + 1).padStart(2, '0');
      const dd = String(monday.getDate()).padStart(2, '0');
      weeks.push({ label: `${dd}/${mm}`, count });
    }
    return weeks;
  }, [completedDates]);

  const maxWeekly = Math.max(...weeklyBars.map(w => w.count), 1);

  // ── Exercises with progression ─────────────────────────────────────────
  const exerciseProgress = useMemo(() => {
    const map = new Map<string, { dates: string[]; weights: number[] }>();

    for (const workout of workouts) {
      for (const ex of workout.exercises) {
        if (ex.history.length < 1) continue;
        const key = ex.name.toLowerCase().trim();
        if (!map.has(key)) map.set(key, { dates: [], weights: [] });
        const entry = map.get(key)!;
        for (const h of ex.history) {
          if (!entry.dates.includes(h.date)) {
            entry.dates.push(h.date);
            entry.weights.push(h.weight);
          }
        }
        // Also include current weight if not already in history for today
        const today = getLocalDate();
        if (ex.currentWeight > 0 && !entry.dates.includes(today) && ex.isFinished) {
          entry.dates.push(today);
          entry.weights.push(ex.currentWeight);
        }
      }
    }

    return Array.from(map.entries())
      .map(([key, val]) => {
        const pairs = val.dates
          .map((d, i) => ({ date: d, weight: val.weights[i] }))
          .sort((a, b) => a.date.localeCompare(b.date));
        const first = pairs[0];
        const last = pairs[pairs.length - 1];
        const delta = last.weight - first.weight;
        return {
          name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          sessions: pairs.length,
          startWeight: first.weight,
          currentWeight: last.weight,
          delta,
          pairs,
        };
      })
      .filter(e => e.sessions >= 1)
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);
  }, [workouts]);

  const hasData = totalWorkouts > 0;
  const hasExerciseHistory = exerciseProgress.some(e => e.sessions >= 2);

  return (
    <div className="p-5 space-y-5 pb-28 animate-fade-in">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-black text-white">Progresso</h1>
        <p className="text-gray-400 text-sm mt-0.5">Sua evolução ao longo do tempo</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-3xl font-black text-white">{totalWorkouts}</p>
          <p className="text-gray-400 text-xs mt-1">Total de treinos</p>
        </div>
        <div className="bg-gradient-to-br from-orange-900/40 to-red-900/30 border border-orange-700/30 rounded-2xl p-4">
          <p className="text-3xl font-black text-white">{streak}</p>
          <p className="text-orange-300 text-xs mt-1">🔥 Sequência atual</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-3xl font-black text-white">{weeklyCount}</p>
          <p className="text-gray-400 text-xs mt-1">Treinos esta semana</p>
        </div>
        <div className="bg-indigo-900/30 border border-indigo-700/30 rounded-2xl p-4">
          <p className="text-3xl font-black text-white">{maxStreak}</p>
          <p className="text-indigo-300 text-xs mt-1">⚡ Melhor sequência</p>
        </div>
      </div>

      {/* 30-Day Activity Grid */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
        <p className="text-white font-bold text-sm mb-3">Últimos 30 dias</p>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {last30.map(({ iso, done }) => (
            <div
              key={iso}
              title={`${formatShortDate(iso)}${done ? ' ✓' : ''}`}
              className={`aspect-square rounded-md transition-colors ${
                done
                  ? 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                  : 'bg-gray-700/60'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-gray-600 text-[10px]">30 dias atrás</span>
          <span className="text-gray-600 text-[10px]">Hoje</span>
        </div>
      </div>

      {/* Weekly Volume Chart */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
        <p className="text-white font-bold text-sm mb-4">Treinos por semana</p>
        <div className="flex items-end gap-1.5 h-24">
          {weeklyBars.map((week, i) => {
            const isLast = i === weeklyBars.length - 1;
            const heightPct = week.count === 0 ? 4 : Math.max((week.count / maxWeekly) * 100, 8);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-700 ${
                      isLast
                        ? 'bg-indigo-500'
                        : week.count > 0
                        ? 'bg-indigo-700/60'
                        : 'bg-gray-700/40'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {week.count > 0 && (
                    <span className="absolute -top-4 text-[9px] font-bold text-gray-400">{week.count}</span>
                  )}
                </div>
                <span className={`text-[9px] leading-tight ${isLast ? 'text-indigo-400 font-bold' : 'text-gray-600'}`}>
                  {isLast ? 'Atual' : week.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exercise Progress */}
      {hasData && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <p className="text-white font-bold text-sm">Evolução dos exercícios</p>
            {!hasExerciseHistory && (
              <p className="text-gray-500 text-xs mt-0.5">Complete mais sessões para ver sua progressão</p>
            )}
          </div>

          {exerciseProgress.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-gray-500 text-sm">Nenhum histórico de exercícios ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/40">
              {exerciseProgress.map((ex) => {
                const deltaPos = ex.delta > 0;
                const deltaNeg = ex.delta < 0;
                const maxW = Math.max(...ex.pairs.map(p => p.weight), 1);
                return (
                  <div key={ex.name} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{ex.name}</p>
                        <p className="text-gray-500 text-[11px]">{ex.sessions} {ex.sessions === 1 ? 'sessão' : 'sessões'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-bold text-sm">{ex.currentWeight} kg</p>
                        {ex.sessions >= 2 && (
                          <p className={`text-[11px] font-semibold ${
                            deltaPos ? 'text-green-400' : deltaNeg ? 'text-red-400' : 'text-gray-500'
                          }`}>
                            {deltaPos ? '+' : ''}{ex.delta.toFixed(1)} kg
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mini sparkline */}
                    {ex.pairs.length >= 2 && (
                      <div className="flex items-end gap-0.5 h-8">
                        {ex.pairs.map((p, i) => {
                          const h = Math.max((p.weight / maxW) * 100, 10);
                          const isLatest = i === ex.pairs.length - 1;
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm transition-all ${
                                isLatest ? 'bg-indigo-400' : 'bg-indigo-800/60'
                              }`}
                              style={{ height: `${h}%` }}
                              title={`${formatShortDate(p.date)}: ${p.weight}kg`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="text-5xl">📊</div>
          <p className="text-white font-bold">Sem dados ainda</p>
          <p className="text-gray-400 text-sm max-w-[260px]">
            Complete seus primeiros treinos para ver sua evolução aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebDashboard;
