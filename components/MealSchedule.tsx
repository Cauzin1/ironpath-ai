// components/AddMealModal.tsx
import React, { useState } from 'react';
import { XIcon, SaveIcon, ClockIcon, AppleIcon } from './icons';
import { supabase } from '../supaBaseClient';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealData: any) => void;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    meal_type: 'lunch',
    meal_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    food_name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    portion_size: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        alert('Usuário não autenticado');
        return;
      }

      const mealData = {
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        meal_type: formData.meal_type,
        meal_time: formData.meal_time,
        food_name: formData.food_name,
        calories: parseInt(formData.calories) || 0,
        protein_g: parseFloat(formData.protein_g) || 0,
        carbs_g: parseFloat(formData.carbs_g) || 0,
        fat_g: parseFloat(formData.fat_g) || 0,
        portion_size: formData.portion_size || null,
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from('daily_meals')
        .insert(mealData);

      if (error) throw error;

      onSave(mealData);
      onClose();
      
      // Reset form
      setFormData({
        meal_type: 'lunch',
        meal_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        food_name: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        portion_size: '',
        notes: ''
      });

    } catch (error) {
      console.error('Erro ao salvar refeição:', error);
      alert('Erro ao salvar refeição. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AppleIcon className="w-5 h-5 text-green-400" />
              Adicionar Refeição
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={saving}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Refeição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Refeição
            </label>
            <select
              value={formData.meal_type}
              onChange={(e) => setFormData({...formData, meal_type: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="breakfast">Café da Manhã</option>
              <option value="lunch">Almoço</option>
              <option value="snack">Lanche</option>
              <option value="dinner">Jantar</option>
              <option value="other">Outro</option>
            </select>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Horário
            </label>
            <input
              type="time"
              value={formData.meal_time}
              onChange={(e) => setFormData({...formData, meal_time: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Nome do Alimento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alimento / Refeição *
            </label>
            <input
              type="text"
              value={formData.food_name}
              onChange={(e) => setFormData({...formData, food_name: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: Frango grelhado com arroz"
              required
            />
          </div>

          {/* Informações Nutricionais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Calorias (kcal) *
              </label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({...formData, calories: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Porção
              </label>
              <input
                type="text"
                value={formData.portion_size}
                onChange={(e) => setFormData({...formData, portion_size: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 200g"
              />
            </div>
          </div>

          {/* Macronutrientes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-blue-300 mb-1">Proteína (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.protein_g}
                onChange={(e) => setFormData({...formData, protein_g: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-yellow-300 mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.carbs_g}
                onChange={(e) => setFormData({...formData, carbs_g: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-purple-300 mb-1">Gorduras (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fat_g}
                onChange={(e) => setFormData({...formData, fat_g: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Ex: Comi metade da porção..."
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <SaveIcon className="w-5 h-5" />
                  Salvar Refeição
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};