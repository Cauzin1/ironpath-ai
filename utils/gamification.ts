// utils/gamification.ts

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

/** Returns current streak (consecutive days ending today or yesterday) */
export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sorted = [...new Set(completedDates)].sort().reverse();
  const today = getLocalDate();
  const yesterday = offsetDate(today, -1);

  // streak must start from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let expected = sorted[0] === today ? today : yesterday;

  for (const date of sorted) {
    if (date === expected) {
      streak++;
      expected = offsetDate(expected, -1);
    } else {
      break;
    }
  }

  return streak;
}

/** Max streak ever achieved */
export function getMaxStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...new Set(completedDates)].sort();
  let max = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === offsetDate(sorted[i - 1], 1)) {
      current++;
      if (current > max) max = current;
    } else {
      current = 1;
    }
  }
  return max;
}

/** Total XP from completed workouts */
export function calculateXP(completedDates: string[]): number {
  return completedDates.length * 100;
}

/** Level based on XP */
export function getLevel(xp: number): { level: number; label: string; nextXP: number; currentXP: number } {
  const thresholds = [
    { level: 1, label: 'Novato', xp: 0 },
    { level: 2, label: 'Iniciante', xp: 500 },
    { level: 3, label: 'Atleta', xp: 1500 },
    { level: 4, label: 'Veterano', xp: 3000 },
    { level: 5, label: 'Elite', xp: 6000 },
    { level: 6, label: 'Lenda', xp: 10000 },
  ];

  let current = thresholds[0];
  for (const t of thresholds) {
    if (xp >= t.xp) current = t;
  }

  const nextIdx = thresholds.findIndex(t => t.level === current.level) + 1;
  const next = thresholds[nextIdx] ?? thresholds[thresholds.length - 1];

  return {
    level: current.level,
    label: current.label,
    nextXP: next.xp,
    currentXP: current.xp,
  };
}

/** Count workouts in the current ISO week (Mon–Sun) */
export function getWeeklyCount(completedDates: string[]): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return completedDates.filter(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt >= monday && dt <= today;
  }).length;
}

/** Achievements list */
export function getAchievements(completedDates: string[]): Achievement[] {
  const total = completedDates.length;
  const streak = calculateStreak(completedDates);
  const maxStreak = getMaxStreak(completedDates);

  return [
    {
      id: 'first_step',
      label: 'Primeiro Passo',
      description: 'Complete seu primeiro treino',
      icon: '🏋️',
      unlocked: total >= 1,
    },
    {
      id: 'one_week',
      label: 'Uma Semana',
      description: '7 treinos completados',
      icon: '📅',
      unlocked: total >= 7,
    },
    {
      id: 'one_month',
      label: 'Um Mês',
      description: '30 treinos completados',
      icon: '🏆',
      unlocked: total >= 30,
    },
    {
      id: 'on_fire',
      label: 'Em Chamas',
      description: 'Sequência de 3 dias',
      icon: '🔥',
      unlocked: maxStreak >= 3,
    },
    {
      id: 'unstoppable',
      label: 'Imparável',
      description: 'Sequência de 7 dias',
      icon: '⚡',
      unlocked: maxStreak >= 7,
    },
    {
      id: 'machine',
      label: 'Máquina',
      description: 'Sequência de 14 dias',
      icon: '💎',
      unlocked: maxStreak >= 14,
    },
  ];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
