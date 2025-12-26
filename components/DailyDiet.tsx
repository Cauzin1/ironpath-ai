// DailyDiet.jsx
import { useState, useEffect } from 'react';
import { Clock, Apple, Droplets, Flame, ChevronRight } from 'lucide-react';
import { supabase } from '../supaBaseClient';

export default function DailyDiet({ selectedDate }) {
  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    fetchDailyDiet();
  }, [selectedDate]);

  const fetchDailyDiet = async () => {
    // Buscar refeições do banco para a data selecionada
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('date', selectedDate.toISOString().split('T')[0])
      .order('time', { ascending: true });

    if (!error && data) {
      setMeals(data);
      
      // Calcular totais
      const totals = data.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein_g || 0),
        carbs: acc.carbs + (meal.carbs_g || 0),
        fat: acc.fat + (meal.fat_g || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      setTotals(totals);
    }
  };

  const mealTimes = [
    { time: '08:00', name: 'Café da Manhã', color: 'bg-orange-100', borderColor: 'border-orange-300' },
    { time: '12:00', name: 'Almoço', color: 'bg-green-100', borderColor: 'border-green-300' },
    { time: '16:00', name: 'Lanche', color: 'bg-yellow-100', borderColor: 'border-yellow-300' },
    { time: '20:00', name: 'Jantar', color: 'bg-blue-100', borderColor: 'border-blue-300' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Apple className="w-5 h-5" />
          Dieta do Dia {selectedDate.toLocaleDateString('pt-BR')}
        </h2>
        <button className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1">
          Ver detalhes <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-xs text-red-600 font-medium">KCAL</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{totals.calories}</p>
          <p className="text-sm text-gray-600">Calorias</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">PROT</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{totals.protein}g</p>
          <p className="text-sm text-gray-600">Proteínas</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <Apple className="w-5 h-5 text-green-500" />
            <span className="text-xs text-green-600 font-medium">CARB</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{totals.carbs}g</p>
          <p className="text-sm text-gray-600">Carboidratos</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-yellow-600 font-medium">GORD</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{totals.fat}g</p>
          <p className="text-sm text-gray-600">Gorduras</p>
        </div>
      </div>

      {/* Lista de Refeições */}
      <div className="space-y-4">
        {mealTimes.map((mealTime) => {
          const meal = meals.find(m => m.time === mealTime.time);
          
          return (
            <div key={mealTime.time} className={`border-l-4 ${mealTime.borderColor} p-4 rounded-r-lg ${mealTime.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <h3 className="font-bold text-gray-800">{mealTime.time} - {mealTime.name}</h3>
                    <p className="text-sm text-gray-600">
                      {meal ? meal.description : 'Nenhuma refeição registrada'}
                    </p>
                  </div>
                </div>
                
                {meal && (
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{meal.calories} kcal</p>
                    <p className="text-xs text-gray-600">
                      {meal.protein_g}P • {meal.carbs_g}C • {meal.fat_g}G
                    </p>
                  </div>
                )}
              </div>
              
              {meal?.ingredients && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {meal.ingredients.split(',').map((ing, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/50 text-xs rounded-full">
                      {ing.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="mt-6 w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02]">
        + Adicionar Refeição Manual
      </button>
    </div>
  );
}