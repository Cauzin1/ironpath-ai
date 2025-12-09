export interface HistoryEntry {
  date: string;
  weight: number;
  reps: number;
}

export interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  currentWeight: number;
  completedSets: number[]; // Array de índices (ex: [0, 1, 2])
  isFinished: boolean;     // NOVO CAMPO: Controla se o exercício foi finalizado/colapsado
  history: HistoryEntry[];
}

export interface Workout {
  name: string;
  exercises: Exercise[];
}

export interface Suggestion {
  exerciseId: number;
  exerciseName: string;
  suggestedWeight: number;
  message: string;
}

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  gender: string;
  experience_level: string;
  goal: string;
}