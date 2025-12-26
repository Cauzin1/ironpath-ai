// hooks/userNutriton.ts (NOME CORRIGIDO: userNutriton → userNutrition)
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supaBaseClient';

interface DailyNutrition {
  calories: { consumed: number; goal: number };
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
}

export const useNutritionData = () => {
  // Estado com valores iniciais estáticos
  const [nutrition, setNutrition] = useState<DailyNutrition>({
    calories: { consumed: 0, goal: 2500 },
    protein: { consumed: 0, goal: 150 },
    carbs: { consumed: 0, goal: 200 },
    fat: { consumed: 0, goal: 70 }
  });
  
  const [remainingMeals, setRemainingMeals] = useState(4);
  const [hasDiet, setHasDiet] = useState(false);
  const [dietName, setDietName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // REFS para controle de estado
  const isMounted = useRef(true);
  const fetchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchDate = useRef<string>('');

  // Função para buscar dados com debounce
  const fetchNutritionData = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    fetchTimeout.current = setTimeout(async () => {
      try {
        // Data atual para cache
        const today = new Date().toISOString().split('T')[0];
        
        // Se já buscamos hoje, não buscar novamente a menos que force
        if (lastFetchDate.current === today && !loading) {
          return;
        }

        lastFetchDate.current = today;
        setLoading(true);

        // 1. Obter usuário
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        
        if (!userId || !isMounted.current) return;

        // 2. Buscar TUDO de uma vez com fallbacks
        const todayDate = new Date().toISOString().split('T')[0];
        
        // Buscar metas com fallback padrão
        let goals = {
          daily_calories: 2500,
          daily_protein_g: 150,
          daily_carbs_g: 200,
          daily_fat_g: 70
        };

        try {
          const { data: goalsData } = await supabase
            .from('nutrition_goals')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle em vez de single para não falhar

          if (goalsData) {
            goals = {
              daily_calories: goalsData.daily_calories || 2500,
              daily_protein_g: goalsData.daily_protein_g || 150,
              daily_carbs_g: goalsData.daily_carbs_g || 200,
              daily_fat_g: goalsData.daily_fat_g || 70
            };
          }
        } catch (goalsError) {
          console.log('Usando metas padrão:', goalsError);
        }

        // Buscar refeições de hoje
        let mealsData = [];
        try {
          const { data: meals } = await supabase
            .from('daily_meals')
            .select('calories, protein_g, carbs_g, fat_g, meal_type')
            .eq('user_id', userId)
            .eq('date', todayDate);

          mealsData = meals || [];
        } catch (mealsError) {
          console.log('Nenhuma refeição encontrada:', mealsError);
        }

        // Buscar dieta ativa
        let activeDiet = null;
        try {
          const { data: diet } = await supabase
            .from('diet_plans')
            .select('name')
            .eq('user_id', userId)
            .eq('active', true)
            .maybeSingle();

          activeDiet = diet;
        } catch (dietError) {
          console.log('Nenhuma dieta ativa:', dietError);
        }

        // 3. Calcular totais (não atualizar estado se não houver mudanças)
        const totals = mealsData.reduce((acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein_g || 0),
          carbs: acc.carbs + (meal.carbs_g || 0),
          fat: acc.fat + (meal.fat_g || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const completedMeals = mealsData.filter(meal => 
          ['breakfast', 'lunch', 'snack', 'dinner'].includes(meal.meal_type)
        ).length;

        // 4. Atualizar estados apenas se necessário
        if (isMounted.current) {
          setNutrition(prev => {
            // Só atualiza se os valores forem diferentes
            if (
              prev.calories.consumed === totals.calories &&
              prev.calories.goal === goals.daily_calories &&
              prev.protein.consumed === totals.protein &&
              prev.protein.goal === goals.daily_protein_g &&
              prev.carbs.consumed === totals.carbs &&
              prev.carbs.goal === goals.daily_carbs_g &&
              prev.fat.consumed === totals.fat &&
              prev.fat.goal === goals.daily_fat_g
            ) {
              return prev;
            }
            
            return {
              calories: { 
                consumed: totals.calories, 
                goal: goals.daily_calories
              },
              protein: { 
                consumed: totals.protein, 
                goal: goals.daily_protein_g
              },
              carbs: { 
                consumed: totals.carbs, 
                goal: goals.daily_carbs_g
              },
              fat: { 
                consumed: totals.fat, 
                goal: goals.daily_fat_g
              }
            };
          });

          setRemainingMeals(prev => {
            const newRemaining = Math.max(0, 4 - completedMeals);
            return prev === newRemaining ? prev : newRemaining;
          });

          setHasDiet(prev => {
            const newHasDiet = !!activeDiet || mealsData.length > 0;
            return prev === newHasDiet ? prev : newHasDiet;
          });

          setDietName(prev => {
            const newDietName = activeDiet?.name || 'Sua Dieta';
            return prev === newDietName ? prev : newDietName;
          });

          setLoading(false);
        }

      } catch (error) {
        console.warn('Erro ao buscar dados nutricionais (silencioso):', error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, 100); // Debounce de 100ms

  }, []);

  // Função para atualizar metas
  const setNutritionGoals = useCallback(async (goals: {
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) return false;

      const { error } = await supabase
        .from('nutrition_goals')
        .upsert({
          user_id: userId,
          ...goals,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      // Atualizar estado local imediatamente (otimista)
      setNutrition(prev => ({
        ...prev,
        calories: { ...prev.calories, goal: goals.daily_calories },
        protein: { ...prev.protein, goal: goals.daily_protein_g },
        carbs: { ...prev.carbs, goal: goals.daily_carbs_g },
        fat: { ...prev.fat, goal: goals.daily_fat_g }
      }));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar metas:', error);
      return false;
    }
  }, []);

  // Efeito para buscar dados
  useEffect(() => {
    isMounted.current = true;
    
    // Buscar dados inicial
    fetchNutritionData();
    
    // Polling menos agressivo (apenas a cada 60 segundos)
    const interval = setInterval(fetchNutritionData, 60000);
    
    // Limpar na desmontagem
    return () => {
      isMounted.current = false;
      clearInterval(interval);
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [fetchNutritionData]);

  // Função para refresh manual (sem debounce)
  const refresh = useCallback(() => {
    lastFetchDate.current = ''; // Resetar cache
    fetchNutritionData();
  }, [fetchNutritionData]);

  return {
    nutrition,
    remainingMeals,
    hasDiet,
    dietName,
    loading,
    setNutritionGoals,
    refresh
  };
};