import React from 'react';
import { Exercise } from '../types';
import { ExerciseItem } from './ExerciseItem';

interface ExerciseListProps {
  exercises: Exercise[];
  onWeightChange: (id: number, w: number) => void;
  onSetToggle: (id: number, s: number) => void;
  onFinishExercise: (id: number) => void; // NOVO PROP
  isWorkoutFinished: boolean;
}

export const ExerciseList: React.FC<ExerciseListProps> = (props) => {
  return (
    <div className="space-y-2 pb-32">
      {props.exercises.map(ex => (
        <ExerciseItem 
          key={ex.id} 
          exercise={ex} 
          {...props} 
        />
      ))}
    </div>
  );
};