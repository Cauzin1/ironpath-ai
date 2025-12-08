import React, { useState } from 'react';
import { Exercise } from '../types';
import { CheckIcon, HistoryIcon, CheckCircleIcon } from './icons';

interface ExerciseItemProps {
  exercise: Exercise;
  onWeightChange: (exerciseId: number, weight: number) => void;
  onSetToggle: (exerciseId: number, setIndex: number) => void;
  onFinishExercise: (exerciseId: number) => void;
  isWorkoutFinished: boolean;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({ 
  exercise, 
  onWeightChange, 
  onSetToggle, 
  onFinishExercise,
  isWorkoutFinished 
}) => {
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const allSetsCompleted = exercise.completedSets.length === exercise.sets;

  // --- ESTADO: EXERCÍCIO FINALIZADO ---
  if (exercise.isFinished) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-3 flex justify-between items-center shadow-sm animate-fade-in">
        <div className="flex items-center space-x-4">
           <button onClick={() => onFinishExercise(exercise.id)} className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-glow hover:bg-green-400 transition-colors">
            <CheckIcon className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-gray-200 line-through decoration-gray-500">{exercise.name}</h3>
            <p className="text-xs text-green-400 font-medium">Finalizado</p>
          </div>
        </div>
        <button onClick={() => onFinishExercise(exercise.id)} className="text-xs font-bold text-gray-500 border border-gray-600 px-3 py-1.5 rounded-lg hover:text-white hover:border-white transition-colors">
          Editar
        </button>
      </div>
    );
  }

  // --- ESTADO: EXERCÍCIO ATIVO ---
  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-5 mb-4 shadow-lg transition-all relative">
      
      <div className="flex items-start space-x-4 mb-5">
        
        {/* CHECKBOX GRANDE (BOTÃO DE FINALIZAR) */}
        {/* Agora com z-index alto para garantir clique */}
        <button 
            onClick={(e) => {
                e.stopPropagation(); // Evita conflitos de clique
                if (navigator.vibrate) navigator.vibrate(20);
                onFinishExercise(exercise.id);
            }}
            className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10
            ${allSetsCompleted ? 'border-green-500 bg-green-500/20' : 'border-gray-500 hover:border-gray-300'}`}
        >
            {allSetsCompleted && <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />}
        </button>

        <div className="flex-1">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white leading-tight cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
                    {exercise.name}
                </h3>
                <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="p-1 -mt-1 text-gray-400 hover:text-white">
                    <HistoryIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">{exercise.sets} séries x {exercise.reps} reps</p>
        </div>
      </div>
      
      {/* HISTÓRICO */}
      {isHistoryVisible && (
        <div className="mb-5 bg-gray-900/50 rounded-xl p-3 text-sm animate-fade-in border border-gray-700/30">
            <p className="text-gray-500 text-[10px] mb-2 uppercase font-bold tracking-wider">Histórico Recente</p>
            {exercise.history && exercise.history.length > 0 ? (
                <div className="flex space-x-3 overflow-x-auto pb-1">
                    {[...exercise.history].reverse().slice(0, 3).map((h, i) => (
                        <div key={i} className="flex-shrink-0 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700 flex flex-col items-center min-w-[70px]">
                            <div className="text-[10px] text-gray-400 mb-1">{new Date(h.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</div>
                            <div className="font-bold text-indigo-300 text-sm">{h.weight}kg</div>
                        </div>
                    ))}
                </div>
            ) : <span className="text-gray-500 italic text-xs">Sem histórico registrado.</span>}
        </div>
      )}

      {/* CONTROLES (PESO E SÉRIES) */}
      <div className="pl-12 space-y-5"> 
        
        {/* Input Carga */}
        <div className="flex items-center space-x-3">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Carga</span>
             <div className="flex-1 flex items-center border-b border-gray-600 focus-within:border-indigo-500 transition-colors pb-1">
                <input
                    type="number"
                    inputMode="decimal"
                    value={exercise.currentWeight === 0 ? '' : exercise.currentWeight}
                    onChange={(e) => onWeightChange(exercise.id, parseFloat(e.target.value) || 0)}
                    disabled={isWorkoutFinished}
                    className="w-20 bg-transparent text-xl font-bold text-white outline-none p-0 text-center"
                    placeholder="0"
                />
                <span className="text-sm text-gray-400 font-medium ml-2">kg</span>
             </div>
        </div>

        {/* Bolinhas de Sets (Grandes e Fáceis de Clicar) */}
        <div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide items-center">
                {Array.from({ length: exercise.sets }).map((_, i) => {
                    const completed = exercise.completedSets.includes(i);
                    return (
                    <button
                        key={i}
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(15); onSetToggle(exercise.id, i); }}
                        disabled={isWorkoutFinished}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 font-bold text-lg
                        ${completed 
                            ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50' 
                            : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                    >
                        {completed ? <CheckIcon className="w-6 h-6" /> : (i + 1)}
                    </button>
                    );
                })}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">Toque para marcar séries</p>
        </div>

        {/* Botão Concluir (Aparece quando todas estão check) */}
        {allSetsCompleted && !isWorkoutFinished && (
          <button
            onClick={() => onFinishExercise(exercise.id)}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl shadow-xl flex items-center justify-center space-x-2 animate-bounce-short transition-transform active:scale-95"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>Concluir Exercício</span>
          </button>
        )}

      </div>
    </div>
  );
};