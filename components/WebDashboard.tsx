import React, { useMemo, useState, useCallback } from 'react';
import { Workout } from '../types';
import { calculateStreak, getWeeklyCount, getMaxStreak } from '../utils/gamification';

const WEEKLY_GOAL_KEY = 'goliasfit_weekly_goal';

function readWeeklyGoal(): number {
  try {
    const v = parseInt(localStorage.getItem(WEEKLY_GOAL_KEY) ?? '', 10);
    return isNaN(v) ? 3 : Math.min(Math.max(v, 1), 7);
  } catch {
    return 3;
  }
}

interface WebDashboardProps {
  workouts: Workout[];
  completedDates: string[];
}

type ExerciseStat = {
  name: string;
  sessions: number;
  startWeight: number;
  currentWeight: number;
  delta: number;
  pairs: { date: string; weight: number }[];
};

function getLocalDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const WebDashboard: React.FC<WebDashboardProps> = ({ workouts, completedDates }) => {
  const dateSet = useMemo(() => new Set(completedDates), [completedDates]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStat | null>(null);
  const [weeklyGoal, setWeeklyGoalState] = useState<number>(readWeeklyGoal);

  const setWeeklyGoal = useCallback((delta: number) => {
    setWeeklyGoalState(prev => {
      const next = Math.min(Math.max(prev + delta, 1), 7);
      try { localStorage.setItem(WEEKLY_GOAL_KEY, String(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

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
  const exerciseProgress = useMemo<ExerciseStat[]>(() => {
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
        {/* Meta semanal configurável */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white font-black text-2xl leading-none">
                {weeklyCount}
                <span className="text-gray-500 text-base font-semibold"> / {weeklyGoal}</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">Treinos esta semana</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeeklyGoal(-1)}
                disabled={weeklyGoal <= 1}
                className="w-7 h-7 rounded-lg bg-gray-700 text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-30 transition-colors"
                aria-label="Diminuir meta"
              >−</button>
              <span className="text-gray-500 text-[10px] font-bold uppercase px-1">meta</span>
              <button
                onClick={() => setWeeklyGoal(+1)}
                disabled={weeklyGoal >= 7}
                className="w-7 h-7 rounded-lg bg-gray-700 text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-30 transition-colors"
                aria-label="Aumentar meta"
              >+</button>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="h-2 bg-gray-700/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                weeklyCount >= weeklyGoal ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min((weeklyCount / weeklyGoal) * 100, 100)}%` }}
            />
          </div>
          {weeklyCount >= weeklyGoal && (
            <p className="text-green-400 text-[11px] font-bold mt-1.5">Meta atingida! 🎯</p>
          )}
        </div>
        <div className="bg-indigo-900/30 border border-indigo-700/30 rounded-2xl p-4 col-span-2 flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-white">{maxStreak}</p>
            <p className="text-indigo-300 text-xs mt-1">⚡ Melhor sequência</p>
          </div>
          <span className="text-4xl opacity-30">🏆</span>
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
            {hasExerciseHistory && (
              <p className="text-gray-500 text-xs mt-0.5">Toque em um exercício para ver o histórico completo</p>
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
                  <button
                    key={ex.name}
                    onClick={() => setSelectedExercise(ex)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{ex.name}</p>
                        <p className="text-gray-500 text-[11px]">{ex.sessions} {ex.sessions === 1 ? 'sessão' : 'sessões'} · toque para detalhes</p>
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
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-white font-bold text-lg">Sem histórico ainda</p>
            <p className="text-gray-400 text-sm mt-1">Complete treinos para ver sua evolução aqui.</p>
          </div>
          <div className="space-y-3">
            {[
              { step: '1', icon: '📄', title: 'Importe seu PDF', desc: 'Vá em Planos e importe sua ficha de treino.' },
              { step: '2', icon: '💪', title: 'Complete um treino', desc: 'Registre pesos e marque as séries na aba Treino.' },
              { step: '3', icon: '📈', title: 'Veja sua evolução', desc: 'Seu progresso aparecerá aqui automaticamente.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex items-start gap-3 bg-gray-900/40 rounded-xl p-3">
                <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-sm font-black text-indigo-400 flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{icon} {title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Histórico detalhado do exercício ── */}
      {selectedExercise && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-gray-900 border-t border-gray-700 rounded-t-3xl w-full max-w-md p-6 pb-10 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{selectedExercise.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{selectedExercise.sessions} {selectedExercise.sessions === 1 ? 'sessão registrada' : 'sessões registradas'}</p>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white text-2xl rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Delta summary */}
            {selectedExercise.sessions >= 2 && (
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Inicial</p>
                  <p className="text-white font-bold">{selectedExercise.startWeight} kg</p>
                </div>
                <div className="flex-1 bg-indigo-900/30 border border-indigo-700/30 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-indigo-400 uppercase font-bold mb-1">Atual</p>
                  <p className="text-indigo-300 font-bold">{selectedExercise.currentWeight} kg</p>
                </div>
                <div className={`flex-1 rounded-xl p-3 text-center border ${
                  selectedExercise.delta > 0
                    ? 'bg-green-900/20 border-green-700/30'
                    : selectedExercise.delta < 0
                    ? 'bg-red-900/20 border-red-700/30'
                    : 'bg-gray-800/60 border-gray-700/50'
                }`}>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Evolução</p>
                  <p className={`font-bold ${
                    selectedExercise.delta > 0 ? 'text-green-400'
                    : selectedExercise.delta < 0 ? 'text-red-400'
                    : 'text-gray-400'
                  }`}>
                    {selectedExercise.delta > 0 ? '+' : ''}{selectedExercise.delta.toFixed(1)} kg
                  </p>
                </div>
              </div>
            )}

            {/* Bar chart — full width with labels */}
            {selectedExercise.pairs.length >= 2 && (() => {
              const maxW = Math.max(...selectedExercise.pairs.map(p => p.weight), 1);
              return (
                <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 mb-5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-3">Evolução de carga</p>
                  <div className="flex items-end gap-1.5" style={{ height: '100px' }}>
                    {selectedExercise.pairs.map((p, i) => {
                      const heightPct = Math.max((p.weight / maxW) * 100, 8);
                      const isLatest = i === selectedExercise.pairs.length - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <span className={`text-[9px] font-bold truncate w-full text-center ${isLatest ? 'text-indigo-300' : 'text-gray-500'}`}>
                            {p.weight}
                          </span>
                          <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                            <div
                              className={`w-full rounded-t-md transition-all ${isLatest ? 'bg-indigo-500' : 'bg-indigo-800/60'}`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-gray-600 text-center leading-tight w-full truncate">
                            {formatShortDate(p.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-gray-600 text-right mt-1">kg</p>
                </div>
              );
            })()}

            {/* History table */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Histórico completo</p>
              <div className="space-y-1.5">
                {[...selectedExercise.pairs].reverse().map((p, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${
                      i === 0
                        ? 'bg-indigo-900/30 border border-indigo-700/30'
                        : 'bg-gray-800/50 border border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[9px] font-black text-indigo-400 bg-indigo-900/50 px-1.5 py-0.5 rounded">ÚLTIMO</span>}
                      <span className="text-gray-400 text-sm">{formatFullDate(p.date)}</span>
                    </div>
                    <span className={`font-bold text-sm ${i === 0 ? 'text-indigo-300' : 'text-white'}`}>
                      {p.weight} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebDashboard;
