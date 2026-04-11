import { supabase } from '../supaBaseClient';
import { Workout } from '../types';

export interface DashboardData {
  strengthData: Array<{
    week: string;
    squat: number;
    bench: number;
    deadlift: number;
  }>;
  volumeData: Array<{
    day: string;
    volume: number;
  }>;
  muscleGroupData: Array<{
    x: string;
    y: number;
  }>;
  metrics: {
    totalWorkouts: number;
    consistencyRate: number;
    strengthProgress: number;
  };
  estimated1RM: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  insights: Array<{
    type: 'positive' | 'warning' | 'info';
    message: string;
  }>;
}

// Fórmula para estimar 1RM (Fórmula de Epley)
const estimate1RM = (weight: number, reps: number): number => {
  if (reps <= 0) return 0;
  return weight * (1 + reps / 30);
};

export const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  try {
    // Buscar histórico de progresso do usuário
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError) throw progressError;

    const workouts: Workout[] = progressData?.workouts || [];
    const completedDates: string[] = progressData?.completed_dates || [];

    // Processar dados para gráficos
    const strengthData = processStrengthData(workouts);
    const volumeData = processVolumeData(workouts, completedDates);
    const muscleGroupData = processMuscleGroupData(workouts);
    const metrics = calculateMetrics(workouts, completedDates);
    const estimated1RM = calculateCurrent1RM(workouts);
    const insights = generateInsights(workouts, completedDates);

    return {
      strengthData,
      volumeData,
      muscleGroupData,
      metrics,
      estimated1RM,
      insights,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Processar dados de força (1RM estimado) por semana
const processStrengthData = (workouts: Workout[]) => {
  if (workouts.length === 0) {
    return [
      { week: 'W1', squat: 0, bench: 0, deadlift: 0 },
      { week: 'W2', squat: 0, bench: 0, deadlift: 0 },
      { week: 'W3', squat: 0, bench: 0, deadlift: 0 },
    ];
  }

  // Agrupar exercícios por tipo
  const strengthData = [];
  const weeks = Math.min(workouts.length, 6);

  for (let i = 0; i < weeks; i++) {
    const workout = workouts[i];
    const weekData = { week: `W${i + 1}`, squat: 0, bench: 0, deadlift: 0 };

    workout.exercises.forEach(exercise => {
      const exerciseName = exercise.name.toLowerCase();
      const weight = exercise.currentWeight || 0;
      const reps = exercise.reps || 0;
      const oneRM = estimate1RM(weight, reps);

      if (exerciseName.includes('agachamento') || exerciseName.includes('squat')) {
        weekData.squat = Math.max(weekData.squat, oneRM);
      } else if (exerciseName.includes('supino') || exerciseName.includes('bench')) {
        weekData.bench = Math.max(weekData.bench, oneRM);
      } else if (exerciseName.includes('terra') || exerciseName.includes('deadlift')) {
        weekData.deadlift = Math.max(weekData.deadlift, oneRM);
      }
    });

    strengthData.push(weekData);
  }

  return strengthData;
};

// Processar volume semanal
const processVolumeData = (workouts: Workout[], _completedDates: string[]) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const volumeData = days.map(day => ({ day, volume: 0 }));

  if (workouts.length === 0) {
    return volumeData;
  }

  workouts.forEach(workout => {
    if (!workout.lastPerformedDate) return;

    const dayIndex = new Date(workout.lastPerformedDate + 'T12:00:00').getDay(); // 0=Dom..6=Sáb
    const volume = workout.exercises.reduce((sum, exercise) => {
      return sum + (exercise.currentWeight || 0) * (exercise.reps || 0) * (exercise.sets || 0);
    }, 0);

    volumeData[dayIndex].volume += volume;
  });

  return volumeData;
};

// Dicionário bilíngue (PT + EN) de palavras-chave por grupo muscular
const MUSCLE_KEYWORDS: Record<string, string[]> = {
  Pernas: [
    // PT
    'agachamento', 'perna', 'quadríceps', 'quadriceps', 'glúteo', 'gluteo',
    'stiff', 'leg press', 'extensão', 'flexora', 'panturrilha', 'hack squat',
    'lunge', 'passada', 'sissy squat', 'step', 'hip thrust', 'elevação pélvica',
    // EN
    'squat', 'leg curl', 'leg extension', 'quad', 'glute', 'calf', 'hamstring',
    'rdl', 'romanian', 'bulgarian', 'goblet', 'sumo',
  ],
  Peito: [
    // PT
    'supino', 'peito', 'pectoral', 'crucifixo', 'voador', 'crossover',
    // EN
    'bench', 'chest', 'fly', 'pec', 'push up', 'pushup', 'push-up', 'dip',
    'cable fly', 'chest press',
  ],
  Costas: [
    // PT
    'remada', 'costas', 'dorsal', 'pulley', 'puxada', 'serrátil', 'terra',
    'levantamento terra', 'barra fixa',
    // EN
    'row', 'pull', 'lat', 'chin', 'back', 'pulldown', 'pull-up', 'pullup',
    'deadlift', 'shrug', 'face pull', 'cable row',
  ],
  Braços: [
    // PT
    'rosca', 'bíceps', 'biceps', 'tríceps', 'triceps', 'martelo', 'scott',
    'paralela', 'frances', 'testa',
    // EN
    'curl', 'tricep', 'bicep', 'extension', 'hammer', 'preacher', 'kickback',
    'skull', 'overhead tricep', 'close grip',
  ],
  Ombro: [
    // PT
    'ombro', 'deltoide', 'delta', 'elevação lateral', 'elevação frontal',
    'desenvolvimento', 'arnold',
    // EN
    'shoulder', 'delt', 'lateral raise', 'front raise', 'overhead press',
    'military press', 'arnold press', 'upright row',
  ],
};

// Processar distribuição por grupo muscular
const processMuscleGroupData = (workouts: Workout[]) => {
  const muscleGroups: Record<string, number> = {
    'Pernas': 0,
    'Costas': 0,
    'Peito': 0,
    'Braços': 0,
    'Ombro': 0,
  };

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const exerciseName = exercise.name.toLowerCase();
      let group = '';

      for (const [groupName, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
        if (keywords.some(kw => exerciseName.includes(kw))) {
          group = groupName;
          break;
        }
      }

      if (group && muscleGroups[group] !== undefined) {
        muscleGroups[group] += 1;
      }
    });
  });

  // Converter para porcentagem
  const total = Object.values(muscleGroups).reduce((a, b) => a + b, 0);
  
  if (total === 0) {
    return [
      { x: 'Pernas', y: 35 },
      { x: 'Costas', y: 25 },
      { x: 'Peito', y: 20 },
      { x: 'Braços', y: 15 },
      { x: 'Ombro', y: 5 },
    ];
  }

  return Object.entries(muscleGroups).map(([name, count]) => ({
    x: name,
    y: Math.round((count / total) * 100)
  }));
};

// Calcular métricas
const calculateMetrics = (workouts: Workout[], completedDates: string[]) => {
  const totalWorkouts = completedDates.length;
  
  // Consistência: treinos nas últimas 4 semanas
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const recentWorkouts = completedDates.filter(date => {
    const workoutDate = new Date(date);
    return workoutDate >= fourWeeksAgo;
  });
  
  const consistencyRate = totalWorkouts > 0 
    ? Math.round((recentWorkouts.length / 4) * 100)
    : 0;

  // Progresso de força: aumento no 1RM do agachamento
  let strengthProgress = 0;
  if (workouts.length >= 2) {
    const firstWorkout = workouts[0];
    const lastWorkout = workouts[workouts.length - 1];
    
    const firstSquat = firstWorkout.exercises.find(e => 
      e.name.toLowerCase().includes('agachamento')
    )?.currentWeight || 0;
    
    const lastSquat = lastWorkout.exercises.find(e => 
      e.name.toLowerCase().includes('agachamento')
    )?.currentWeight || 0;
    
    if (firstSquat > 0) {
      strengthProgress = Math.round(((lastSquat - firstSquat) / firstSquat) * 100);
    }
  }

  return {
    totalWorkouts,
    consistencyRate: Math.min(consistencyRate, 100),
    strengthProgress: Math.max(strengthProgress, 0),
  };
};

// Calcular 1RM atual estimado
const calculateCurrent1RM = (workouts: Workout[]) => {
  const result = { squat: 0, bench: 0, deadlift: 0 };

  if (workouts.length === 0) return result;

  const lastWorkout = workouts[workouts.length - 1];

  lastWorkout.exercises.forEach(exercise => {
    const exerciseName = exercise.name.toLowerCase();
    const weight = exercise.currentWeight || 0;
    const reps = exercise.reps || 0;
    const oneRM = estimate1RM(weight, reps);

    if (exerciseName.includes('agachamento') || exerciseName.includes('squat')) {
      result.squat = Math.max(result.squat, oneRM);
    } else if (exerciseName.includes('supino') || exerciseName.includes('bench')) {
      result.bench = Math.max(result.bench, oneRM);
    } else if (exerciseName.includes('terra') || exerciseName.includes('deadlift')) {
      result.deadlift = Math.max(result.deadlift, oneRM);
    }
  });

  return {
    squat: Math.round(result.squat),
    bench: Math.round(result.bench),
    deadlift: Math.round(result.deadlift),
  };
};

// Gerar insights
const generateInsights = (workouts: Workout[], completedDates: string[]) => {
  const insights = [];

  // Insight de consistência
  if (completedDates.length >= 4) {
    insights.push({
      type: 'positive' as const,
      message: 'Excelente consistência! Você treinou 4 semanas seguidas.',
    });
  }

  // Insight de estagnação
  if (workouts.length >= 3) {
    const lastThree = workouts.slice(-3);
    const hasProgress = lastThree.some((workout, index) => {
      if (index === 0) return false;
      const prev = lastThree[index - 1];
      const currentTotal = workout.exercises.reduce((sum, e) => sum + (e.currentWeight || 0), 0);
      const prevTotal = prev.exercises.reduce((sum, e) => sum + (e.currentWeight || 0), 0);
      return currentTotal > prevTotal;
    });

    if (!hasProgress) {
      insights.push({
        type: 'warning' as const,
        message: 'Seu progresso parece estar estagnado. Considere aumentar a carga ou variar os exercícios.',
      });
    }
  }

  // Insight de volume
  if (workouts.length > 0) {
    const lastWorkout = workouts[workouts.length - 1];
    const totalVolume = lastWorkout.exercises.reduce((sum, exercise) => {
      return sum + ((exercise.currentWeight || 0) * (exercise.reps || 0) * (exercise.sets || 0));
    }, 0);

    if (totalVolume > 10000) {
      insights.push({
        type: 'positive' as const,
        message: 'Volume de treino impressionante! Continue assim.',
      });
    }
  }

  // Insight padrão
  if (insights.length === 0) {
    insights.push({
      type: 'info' as const,
      message: 'Continue treinando! Cada sessão conta.',
    });
  }

  return insights;
};

