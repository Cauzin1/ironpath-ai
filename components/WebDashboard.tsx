// components/WebDashboard.tsx - VERSÃO CORRIGIDA PARA TEMA ESCURO
import React, { useEffect, useState } from 'react';
import { fetchDashboardData, DashboardData } from '../services/DashboardService';

interface WebDashboardProps {
  userId: string;
}

const WebDashboard: React.FC<WebDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardData(userId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Não foi possível carregar os dados do dashboard');
      
      // Dados de fallback
      setDashboardData(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = (): DashboardData => {
    return {
      strengthData: [
        { week: 'W1', squat: 60, bench: 40, deadlift: 80 },
        { week: 'W2', squat: 65, bench: 45, deadlift: 85 },
        { week: 'W3', squat: 70, bench: 50, deadlift: 90 },
        { week: 'W4', squat: 72.5, bench: 52.5, deadlift: 95 },
        { week: 'W5', squat: 75, bench: 55, deadlift: 100 },
        { week: 'W6', squat: 77.5, bench: 57.5, deadlift: 105 },
      ],
      volumeData: [
        { day: 'Seg', volume: 8500 },
        { day: 'Ter', volume: 9200 },
        { day: 'Qua', volume: 7800 },
        { day: 'Qui', volume: 9500 },
        { day: 'Sex', volume: 8800 },
        { day: 'Sáb', volume: 0 },
        { day: 'Dom', volume: 0 },
      ],
      muscleGroupData: [
        { x: 'Pernas', y: 35 },
        { x: 'Costas', y: 25 },
        { x: 'Peito', y: 20 },
        { x: 'Braços', y: 15 },
        { x: 'Ombro', y: 5 },
      ],
      metrics: {
        totalWorkouts: 0,
        consistencyRate: 0,
        strengthProgress: 0,
      },
      estimated1RM: {
        squat: 80,
        bench: 55,
        deadlift: 100,
      },
      insights: [
        {
          type: 'info',
          message: 'Comece a registrar seus treinos para ver estatísticas detalhadas.',
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-gray-400">Carregando dashboard...</p>
      </div>
    );
  }

  if (error && (!dashboardData || dashboardData.metrics.totalWorkouts === 0)) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg font-bold mb-2">⚠️ Erro ao carregar</div>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { strengthData, metrics, estimated1RM, insights } = dashboardData;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">📊 Dashboard de Progresso</h1>
        <p className="text-gray-400 mt-2">Acompanhe sua evolução e desempenho</p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="text-2xl font-bold text-white">{metrics.totalWorkouts}</div>
          <div className="text-sm text-gray-400 font-medium">Treinos</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="text-2xl font-bold text-white">{metrics.consistencyRate}%</div>
          <div className="text-sm text-gray-400 font-medium">Consistência</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="text-2xl font-bold text-white">+{metrics.strengthProgress}%</div>
          <div className="text-sm text-gray-400 font-medium">Força</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="text-2xl font-bold text-white">{strengthData.length}</div>
          <div className="text-sm text-gray-400 font-medium">Semanas</div>
        </div>
      </div>

      {/* Gráfico de Força */}
      <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">📈 Evolução das Cargas</h2>
        <div className="h-64 relative">
          {/* Linhas de referência - CORES ESCURAS */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100, 125].map((value) => (
              <div key={value} className="flex items-center">
                <div className="w-12 text-right text-sm font-medium text-gray-400 pr-3">{value}kg</div>
                <div className="flex-1 border-t border-gray-700"></div>
              </div>
            ))}
          </div>

          {/* Barras para cada semana */}
          <div className="absolute inset-0 flex items-end px-10 pt-8 pb-6">
            {strengthData.map((week: any, index: number) => (
              <div key={week.week} className="flex-1 flex flex-col items-center mx-1">
                <div className="flex items-end space-x-1 w-full justify-center">
                  <div 
                    className="w-1/3 bg-blue-600 rounded-t"
                    style={{ height: `${(week.squat / 125) * 80}%` }}
                    title={`Agachamento: ${week.squat}kg`}
                  ></div>
                  <div 
                    className="w-1/3 bg-green-600 rounded-t"
                    style={{ height: `${(week.bench / 125) * 80}%` }}
                    title={`Supino: ${week.bench}kg`}
                  ></div>
                  <div 
                    className="w-1/3 bg-orange-600 rounded-t"
                    style={{ height: `${(week.deadlift / 125) * 80}%` }}
                    title={`Levantamento Terra: ${week.deadlift}kg`}
                  ></div>
                </div>
                <div className="text-sm font-medium text-gray-300 mt-3">{week.week}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legenda - CORES ESCURAS */}
        <div className="flex justify-center space-x-6 mt-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-300">Agachamento</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-300">Supino</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-300">Lev. Terra</span>
          </div>
        </div>
      </div>

      {/* 1RM Atual - CORES ESCURAS */}
      <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">🏋️‍♂️ 1RM Atual Estimado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-blue-600 pl-4 py-4 bg-blue-900/20 rounded-r">
            <div className="text-sm font-medium text-gray-400">Agachamento</div>
            <div className="text-2xl font-bold text-white">{Math.round(estimated1RM.squat)} kg</div>
          </div>
          <div className="border-l-4 border-green-600 pl-4 py-4 bg-green-900/20 rounded-r">
            <div className="text-sm font-medium text-gray-400">Supino</div>
            <div className="text-2xl font-bold text-white">{Math.round(estimated1RM.bench)} kg</div>
          </div>
          <div className="border-l-4 border-orange-600 pl-4 py-4 bg-orange-900/20 rounded-r">
            <div className="text-sm font-medium text-gray-400">Levantamento Terra</div>
            <div className="text-2xl font-bold text-white">{Math.round(estimated1RM.deadlift)} kg</div>
          </div>
        </div>
      </div>

      {/* Insights - CORES ESCURAS */}
      <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4 text-white">💡 Insights do GOLIAS Coach</h2>
        <div className="space-y-4">
          {insights.map((insight: any, index: number) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'positive' 
                  ? 'bg-blue-900/20 border-blue-600' 
                  : insight.type === 'warning'
                  ? 'bg-yellow-900/20 border-yellow-600'
                  : 'bg-gray-800/50 border-gray-600'
              }`}
            >
              <div className="flex items-start">
                <span className="mr-3 text-lg">
                  {insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'}
                </span>
                <p className={`font-medium ${
                  insight.type === 'positive' 
                    ? 'text-blue-300' 
                    : insight.type === 'warning'
                    ? 'text-yellow-300'
                    : 'text-gray-300'
                }`}>
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão de Recarregar */}
      <div className="mt-8 text-center">
        <button
          onClick={loadData}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg border border-gray-700"
        >
          Atualizar Dashboard
        </button>
      </div>
    </div>
  );
};

export default WebDashboard;