import React, { useRef } from 'react';
import { TrainingIcon, CheckCircleIcon, UploadIcon } from './icons';
import { Workout } from '../types';

interface MenuProps {
  completedDates: string[];
  workouts: Workout[];
  currentWorkoutIndex: number;
  onWorkoutSelect: (index: number) => void;
  onFileImport: (file: File) => void;
}

const getWeekDays = (): Date[] => {
  const today = new Date();
  const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1; // Ajusta segunda como 0
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - currentDay);
  
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
  }
  return weekDays;
};

const dayInitials = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export const Menu: React.FC<MenuProps> = ({ completedDates, workouts, currentWorkoutIndex, onWorkoutSelect, onFileImport }) => {
  const weekDays = getWeekDays();
  const todayISO = new Date().toISOString().split('T')[0];
  const completedISODates = new Set(completedDates);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 mb-6">
      {/* Barra de Navegação de Dias da Semana (Controle de Frequência) */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-4 rounded-xl flex justify-between items-center shadow-lg">
         {weekDays.map((day, index) => {
          const dayISO = day.toISOString().split('T')[0];
          const isToday = dayISO === todayISO;
          const isCompleted = completedISODates.has(dayISO);
          
          return (
            <div key={dayISO} className={`flex flex-col items-center justify-center w-10 h-14 sm:w-14 sm:h-20 rounded-lg transition-all ${isToday ? 'bg-gray-700 ring-1 ring-indigo-500' : 'bg-transparent'}`}>
              <span className={`text-[10px] sm:text-xs font-bold mb-1 ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>
                {dayInitials[index]}
              </span>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                 {isCompleted ? <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm font-bold">{day.getDate()}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Abas de Divisão de Treino (ex: Treino A, Treino B) */}
      <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
        {workouts.map((workout, index) => {
            const isActive = currentWorkoutIndex === index;
            return (
                <button 
                  key={index}
                  onClick={() => onWorkoutSelect(index)}
                  className={`flex-shrink-0 flex items-center space-x-2 py-3 px-5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base border
                    ${isActive 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`
                    }
                >
                  <TrainingIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {/* Tenta pegar apenas a letra ou nome curto se for muito longo */}
                  <span className="whitespace-nowrap">{workout.name.length > 15 ? workout.name.substring(0, 12) + '...' : workout.name}</span>
                </button>
            );
        })}
        
        {/* Botão discreto para importar outro PDF caso precise */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 flex items-center justify-center w-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          title="Importar novo PDF"
        >
          <UploadIcon className="w-5 h-5" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files?.[0] && onFileImport(e.target.files[0])}
          accept="application/pdf"
          className="hidden" 
        />
      </div>
    </div>
  );
};