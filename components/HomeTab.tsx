import React from 'react';
import { UserProfile, Workout } from '../types';
import { DumbbellIcon, PlayIcon, UploadIcon, SparklesIcon, CalendarIcon } from './icons';

interface HomeTabProps {
  userProfile: UserProfile;
  workoutName?: string;
  completedCount: number;
  onStartWorkout: () => void;
  onImportClick: () => void;
  hasWorkout: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ 
  userProfile, 
  workoutName, 
  completedCount, 
  onStartWorkout, 
  onImportClick,
  hasWorkout 
}) => {
  
  // Saudação baseada na hora
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-bold text-white">Atleta</h1>
        </div>
        <div className="bg-gray-800 p-2 rounded-full border border-gray-700">
          <DumbbellIcon className="w-6 h-6 text-indigo-500" />
        </div>
      </div>

      {/* Card de Resumo do Perfil */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg flex justify-between items-center">
        <div>
            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Objetivo Atual</p>
            <p className="text-white font-bold text-lg capitalize">{userProfile.goal}</p>
            <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 capitalize">
                    {userProfile.experience_level}
                </span>
                <span className="text-xs text-gray-500">{userProfile.weight}kg</span>
            </div>
        </div>
        <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <SparklesIcon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-2 mb-2">
                <CalendarIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Treinos Feitos</span>
            </div>
            <p className="text-2xl font-black text-white">{completedCount}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-2 mb-2">
                <DumbbellIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Próximo</span>
            </div>
            <p className="text-sm font-bold text-white truncate">
                {hasWorkout ? workoutName?.split(' ')[0] : '---'}
            </p>
        </div>
      </div>

      {/* Ação Principal */}
      <div className="pt-4">
        <h3 className="text-white font-bold mb-4 text-lg">Ação Rápida</h3>
        
        {hasWorkout ? (
            <button 
                onClick={onStartWorkout}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white p-5 rounded-2xl shadow-xl flex items-center justify-between group"
            >
                <div className="text-left">
                    <p className="font-bold text-lg">Ir para o Treino</p>
                    <p className="text-indigo-200 text-xs">{workoutName}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                    <PlayIcon className="w-6 h-6 text-white" />
                </div>
            </button>
        ) : (
            <label className="w-full bg-gray-800 border-2 border-dashed border-gray-600 hover:border-indigo-500 active:bg-gray-700 transition-all text-gray-400 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer gap-2">
                <UploadIcon className="w-8 h-8 text-gray-500" />
                <span className="font-bold">Importar Ficha (PDF)</span>
                <span className="text-xs text-center">Toque para enviar seu treino</span>
                <input 
                    type="file" 
                    className="hidden" 
                    accept="application/pdf" 
                    onChange={(e) => e.target.files?.[0] && onImportClick()} 
                />
            </label>
        )}
      </div>

    </div>
  );
};