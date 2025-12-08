
import { Workout } from './types';

export const initialWorkout: Workout = {
  name: "Treino A - Peito e Tríceps",
  exercises: [
    {
      id: 1,
      name: "Supino Reto",
      sets: 3,
      reps: 10,
      currentWeight: 40,
      completedSets: [],
      history: [
        { date: "2024-07-15", weight: 38, reps: 10 },
        { date: "2024-07-18", weight: 40, reps: 10 }
      ]
    },
    {
      id: 2,
      name: "Crucifixo Inclinado",
      sets: 3,
      reps: 12,
      currentWeight: 12,
      completedSets: [],
      history: [
        { date: "2024-07-15", weight: 10, reps: 12 },
        { date: "2024-07-18", weight: 12, reps: 11 }
      ]
    },
    {
      id: 3,
      name: "Tríceps Pulley",
      sets: 4,
      reps: 12,
      currentWeight: 25,
      completedSets: [],
      history: []
    },
    {
      id: 4,
      name: "Elevação Lateral",
      sets: 3,
      reps: 15,
      currentWeight: 8,
      completedSets: [],
      history: [
         { date: "2024-07-15", weight: 8, reps: 12 },
         { date: "2024-07-18", weight: 8, reps: 14 }
      ]
    }
  ]
};
