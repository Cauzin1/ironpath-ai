// components/GoalSettingsModal.tsx
import React, { useState } from 'react';
import { XIcon, SaveIcon } from './icons';

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: {
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
  };
  onSave: (goals: {
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
  }) => Promise<boolean>;
}

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  isOpen,
  onClose,
  currentGoals,
  onSave
}) => {
  const [goals, setGoals] = useState(currentGoals);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(goals);
    setSaving(false);
    
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Configurar Metas Diárias</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Calorias */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Calorias (kcal)
            </label>
            <input
              type="number"
              value={goals.daily_calories}
              onChange={(e) => setGoals({...goals, daily_calories: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
              max="10000"
            />
          </div>

          {/* Proteína */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proteína (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={goals.daily_protein_g}
              onChange={(e) => setGoals({...goals, daily_protein_g: parseFloat(e.target.value) || 0})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="500"
            />
          </div>

          {/* Carboidratos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Carboidratos (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={goals.daily_carbs_g}
              onChange={(e) => setGoals({...goals, daily_carbs_g: parseFloat(e.target.value) || 0})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              min="0"
              max="1000"
            />
          </div>

          {/* Gorduras */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gorduras (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={goals.daily_fat_g}
              onChange={(e) => setGoals({...goals, daily_fat_g: parseFloat(e.target.value) || 0})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
              max="500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <SaveIcon className="w-5 h-5" />
                Salvar Metas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};