// components/WebDashboard.tsx - Versão com cores corrigidas
import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../services/DashboardService';

interface WebDashboardProps {
  userId: string;
}

const WebDashboard: React.FC<WebDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const data = await fetchDashboardData(userId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700">Não foi possível carregar os dados do dashboard.</p>
      </div>
    );
  }

  const { strengthData, metrics, estimated1RM, insights } = dashboardData;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Progresso</h1>
        <p className="text-gray-700 mt-2 font-medium">Acompanhe sua evolução</p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-700">{metrics.totalWorkouts}</div>
          <div className="text-sm text-gray-800 font-medium">Treinos</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-700">{metrics.consistencyRate}%</div>
          <div className="text-sm text-gray-800 font-medium">Consistência</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-700">+{metrics.strengthProgress}%</div>
          <div className="text-sm text-gray-800 font-medium">Força</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-700">{strengthData.length}</div>
          <div className="text-sm text-gray-800 font-medium">Semanas</div>
        </div>
      </div>

      {/* Gráfico de Força - Corrigido cores escuras */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Evolução das Cargas</h2>
        <div className="h-64 relative">
          {/* Linha horizontal de referência - CORRIGIDO: cores mais escuras */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100, 125].map((value) => (
              <div key={value} className="flex items-center">
                <div className="w-12 text-right text-sm font-medium text-gray-800 pr-3">{value}kg</div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            ))}
          </div>

          {/* Barras para cada semana - CORRIGIDO: semanas mais escuras */}
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
                <div className="text-sm font-medium text-gray-900 mt-3">{week.week}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legenda - CORRIGIDO: cores mais escuras */}
        <div className="flex justify-center space-x-6 mt-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Agachamento</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Supino</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Lev. Terra</span>
          </div>
        </div>
      </div>

      {/* 1RM Atual - CORRIGIDO: textos mais escuros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">1RM Atual Estimado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-blue-600 pl-4 py-4 bg-blue-50 rounded-r">
            <div className="text-sm font-medium text-gray-800">Agachamento</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(estimated1RM.squat)} kg</div>
          </div>
          <div className="border-l-4 border-green-600 pl-4 py-4 bg-green-50 rounded-r">
            <div className="text-sm font-medium text-gray-800">Supino</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(estimated1RM.bench)} kg</div>
          </div>
          <div className="border-l-4 border-orange-600 pl-4 py-4 bg-orange-50 rounded-r">
            <div className="text-sm font-medium text-gray-800">Levantamento Terra</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(estimated1RM.deadlift)} kg</div>
          </div>
        </div>
      </div>

      {/* Insights - CORRIGIDO: textos mais escuros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-900">📈 Insights do GOLIAS Coach</h2>
        <div className="space-y-4">
          {insights.map((insight: any, index: number) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'positive' 
                  ? 'bg-blue-50 border-blue-600' 
                  : insight.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-600'
                  : 'bg-gray-50 border-gray-600'
              }`}
            >
              <div className="flex items-start">
                <span className="mr-3 text-lg">
                  {insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'}
                </span>
                <p className={`font-medium ${
                  insight.type === 'positive' 
                    ? 'text-blue-900' 
                    : insight.type === 'warning'
                    ? 'text-yellow-900'
                    : 'text-gray-900'
                }`}>
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebDashboard;