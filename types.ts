export interface HistoryEntry {
  date: string;
  weight: number;
  reps: number;
  rpe?: number; // Percepção de Esforço: 1 (fácil) a 10 (falha)
}

export interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  currentWeight: number;
  completedSets: number[]; // Array de índices (ex: [0, 1, 2])
  isFinished: boolean;     // Controla se o exercício foi finalizado/colapsado
  rpe?: number;            // Percepção de Esforço da sessão atual: 1-10
  history: HistoryEntry[];
  restTime?: number;   // segundos de descanso entre séries (ex: 60, 90, 120)
  notes?: string;      // observações do professor para este exercício
}

export interface Workout {
  name: string;
  scheduledDays?: string;    // Ex: "Segunda e Quinta"
  lastPerformedDate?: string; // ISO date do último treino deste dia
  exercises: Exercise[];
}

export interface Suggestion {
  exerciseId: number;
  exerciseName: string;
  suggestedWeight: number;
  currentWeight?: number; // Carga usada na sessão atual (para mostrar o delta)
  message: string;
  recommendation_type?: 'increase' | 'maintain' | 'decrease' | 'deload' | 'plateau';
  technique?: string | null;
  periodization_note?: string | null;
}

export interface UserProfile {
  name?: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  experience_level: string;
  goal: string;
  avatar_url?: string;
  role?: 'aluno' | 'professor';
}

export interface TrainerStudent {
  id: string;
  trainer_id: string;
  student_id: string;
  student_name: string;
  trainer_name: string;
  joined_at: string;
}

export interface TrainerWorkout {
  id: string;
  trainer_id: string;
  name: string;
  workouts: Workout[];
  created_at: string;
  updated_at: string;
}

export interface AssignedWorkout {
  id: string;
  trainer_id: string;
  student_id: string;
  trainer_workout_id: string | null;
  workout_name: string;
  workouts: Workout[];
  trainer_name: string;
  assigned_at: string;
  is_active: boolean;
  activated_at: string | null;
}

export interface TrainerInvite {
  id: string;
  trainer_id: string;
  trainer_name: string;
  code: string;
  created_at: string;
}

export interface StudentProgress {
  totalWorkouts: number;
  streak: number;
  lastWorkoutDate: string | null; // ISO date da sessão mais recente
  activeProgramName: string | null;
}

// Adicione essas interfaces se ainda não existirem
export interface DailyNutrition {
  calories: {
    consumed: number;
    goal: number;
  };
  protein: {
    consumed: number;
    goal: number;
  };
  carbs: {
    consumed: number;
    goal: number;
  };
  fat: {
    consumed: number;
    goal: number;
  };
}

export interface DietPlan {
  id: string;
  name: string;
  description: string;
  dailyCalories: number;
  mealsPerDay: number;
  active: boolean;
}