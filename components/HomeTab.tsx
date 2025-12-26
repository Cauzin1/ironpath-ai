// components/HomeTab.tsx (versão atualizada)
import React, { useState } from 'react';
import { UserProfile, Workout } from '../types';
import { 
  DumbbellIcon, 
  PlayIcon, 
  UploadIcon, 
  SparklesIcon, 
  CalendarIcon,
  AppleIcon,
  ChefHatIcon,
  FlameIcon,
  PlusIcon,
  EditIcon,
  TargetIcon
} from './icons';
import { useNutritionData } from '../hooks/userNutriton';
import { GoalSettingsModal } from './GoalSettingsModal';

interface HomeTabProps {
  userProfile: UserProfile;
  workoutName?: string;
  completedCount: number;
  onStartWorkout: () => void;
  onImportClick: () => void;
  hasWorkout: boolean;
  onGoToDiet: () => void;
  onAddMeal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ 
  userProfile, 
  workoutName, 
  completedCount, 
  onStartWorkout, 
  onImportClick,
  hasWorkout,
  onGoToDiet,
  onAddMeal
}) => {
  
  const { 
    nutrition, 
    remainingMeals, 
    hasDiet, 
    dietName, 
    loading,
    setNutritionGoals 
  } = useNutritionData();
  
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  
  const calorieProgress = Math.min(
    (nutrition.calories.consumed / nutrition.calories.goal) * 100, 
    100
  );

  // Funções de utilidade para calcular porcentagens
  const calculatePercentage = (consumed: number, goal: number) => {
    return goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 pb-24">
        {/* Skeletons de loading */}
        <div className="h-12 bg-gray-800 rounded-xl animate-pulse"></div>
        <div className="h-40 bg-gray-800 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-bold text-white">Atleta</h1>
        </div>
        <div className="flex gap-2">
          <div className="bg-gray-800 p-2 rounded-full border border-gray-700">
            <DumbbellIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="bg-gray-800 p-2 rounded-full border border-gray-700">
            <AppleIcon className="w-6 h-6 text-green-500" />
          </div>
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
      <div className="grid grid-cols-3 gap-3">
        {/* Treinos Feitos */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Treinos Feitos</span>
          </div>
          <p className="text-2xl font-black text-white">{completedCount}</p>
        </div>
        
        {/* Próximo Treino */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <DumbbellIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Próximo</span>
          </div>
          <p className="text-sm font-bold text-white truncate">
            {hasWorkout ? workoutName?.split(' ')[0] : '---'}
          </p>
        </div>
        
        {/* Refeições Restantes */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <AppleIcon className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Refeições</span>
          </div>
          <p className="text-2xl font-black text-white">{remainingMeals}</p>
          <p className="text-[10px] text-gray-400 mt-1">restantes hoje</p>
        </div>
      </div>

      {/* Card de Progresso da Dieta (COM DADOS REAIS) */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg relative">
        {/* Botão para editar metas */}
        <button 
          onClick={() => setShowGoalSettings(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          title="Editar metas"
        >
          <TargetIcon className="w-5 h-5" />
        </button>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-900/30 p-2 rounded-lg border border-green-700/30">
              <FlameIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Consumo Diário</p>
              <p className="text-white font-bold">
                {nutrition.calories.consumed}/{nutrition.calories.goal} kcal
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            calorieProgress >= 90 ? 'bg-red-900/50 text-red-300 border border-red-700/30' :
            calorieProgress >= 70 ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/30' :
            'bg-green-900/50 text-green-300 border border-green-700/30'
          }`}>
            {calorieProgress.toFixed(0)}%
          </span>
        </div>
        
        {/* Barra de Progresso */}
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full transition-all duration-500 ${
              calorieProgress >= 90 ? 'bg-red-500' :
              calorieProgress >= 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${calorieProgress}%` }}
          ></div>
        </div>
        
        {/* Macronutrientes (DADOS REAIS) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs text-blue-300">Proteína</p>
            <p className="text-sm font-bold">
              {nutrition.protein.consumed}g
              <span className="text-xs text-gray-400 ml-1">
                /{nutrition.protein.goal}g
              </span>
            </p>
            <div className="w-full bg-gray-700 h-1 rounded-full mt-1">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ 
                  width: `${calculatePercentage(nutrition.protein.consumed, nutrition.protein.goal)}%` 
                }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-yellow-300">Carboidratos</p>
            <p className="text-sm font-bold">
              {nutrition.carbs.consumed}g
              <span className="text-xs text-gray-400 ml-1">
                /{nutrition.carbs.goal}g
              </span>
            </p>
            <div className="w-full bg-gray-700 h-1 rounded-full mt-1">
              <div 
                className="h-full bg-yellow-500 rounded-full"
                style={{ 
                  width: `${calculatePercentage(nutrition.carbs.consumed, nutrition.carbs.goal)}%` 
                }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-300">Gorduras</p>
            <p className="text-sm font-bold">
              {nutrition.fat.consumed}g
              <span className="text-xs text-gray-400 ml-1">
                /{nutrition.fat.goal}g
              </span>
            </p>
            <div className="w-full bg-gray-700 h-1 rounded-full mt-1">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ 
                  width: `${calculatePercentage(nutrition.fat.consumed, nutrition.fat.goal)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Botão para adicionar refeição rápida */}
        <button 
          onClick={onAddMeal}
          className="mt-4 w-full py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-green-500/30 rounded-lg flex items-center justify-center gap-2 transition-all group"
        >
          <PlusIcon className="w-4 h-4 text-green-400 group-hover:scale-110" />
          <span className="text-sm text-gray-300 group-hover:text-white">
            Registrar nova refeição
          </span>
        </button>
      </div>

      {/* Ação Principal */}
      <div className="pt-2 space-y-4">
        <h3 className="text-white font-bold text-lg">Ação Rápida</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card de Treino */}
          <div className={hasWorkout ? 'bg-gradient-to-br from-indigo-900/30 to-indigo-800/20 border border-indigo-700/30' : 'bg-gray-800 border-2 border-dashed border-gray-700'}>
            {hasWorkout ? (
              <button 
                onClick={onStartWorkout}
                className="w-full p-5 rounded-2xl flex items-center justify-between group hover:bg-indigo-800/10 transition-colors"
              >
                <div className="text-left">
                  <p className="font-bold text-lg text-white">Ir para o Treino</p>
                  <p className="text-indigo-200 text-xs">{workoutName}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                  <PlayIcon className="w-6 h-6 text-white" />
                </div>
              </button>
            ) : (
              <label className="w-full p-5 rounded-2xl flex flex-col items-center justify-center cursor-pointer gap-3 hover:bg-gray-800/50 transition-colors">
                <div className="bg-gray-700 p-3 rounded-full">
                  <UploadIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-white">Importar Ficha (PDF)</span>
                  <p className="text-xs text-gray-400 mt-1">Envie seu treino</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="application/pdf" 
                  onChange={(e) => e.target.files?.[0] && onImportClick()} 
                />
              </label>
            )}
          </div>

          {/* Card de Dieta */}
          <div className={hasDiet ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30' : 'bg-gray-800 border-2 border-dashed border-gray-700'}>
            {hasDiet ? (
              <button 
                onClick={onGoToDiet}
                className="w-full p-5 rounded-2xl flex items-center justify-between group hover:bg-green-800/10 transition-colors"
              >
                <div className="text-left">
                  <p className="font-bold text-lg text-white">Ver Minha Dieta</p>
                  <p className="text-green-200 text-xs">{dietName}</p>
                  <p className="text-[10px] text-green-300 mt-1">
                    {remainingMeals} refeições pendentes hoje
                  </p>
                </div>
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                  <AppleIcon className="w-6 h-6 text-white" />
                </div>
              </button>
            ) : (
              <button 
                onClick={onAddMeal}
                className="w-full p-5 rounded-2xl flex items-center justify-center cursor-pointer gap-3 hover:bg-gray-800/50 transition-colors"
              >
                <div className="bg-gray-700 p-3 rounded-full">
                  <PlusIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-white">Criar Dieta</span>
                  <p className="text-xs text-gray-400 mt-1">Comece sua jornada</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Configurar Metas */}
      <GoalSettingsModal
        isOpen={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        currentGoals={{
          daily_calories: nutrition.calories.goal,
          daily_protein_g: nutrition.protein.goal,
          daily_carbs_g: nutrition.carbs.goal,
          daily_fat_g: nutrition.fat.goal
        }}
        onSave={setNutritionGoals}
      />
    </div>
  );
};