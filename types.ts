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