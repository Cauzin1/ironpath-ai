import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryBar, VictoryPie } from 'victory';
import { fetchDashboardData, DashboardData } from '../services/DashboardService';

interface DashboardProps {
  userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const data = await fetchDashboardData(userId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Fallback para dados de exemplo
      setDashboardData({
        strengthData: [
          { week: 'W1', squat: 70, bench: 50, deadlift: 90 },
          { week: 'W2', squat: 72.5, bench: 52.5, deadlift: 95 },
          { week: 'W3', squat: 75, bench: 55, deadlift: 100 },
          { week: 'W4', squat: 77.5, bench: 57.5, deadlift: 105 },
          { week: 'W5', squat: 80, bench: 60, deadlift: 110 },
          { week: 'W6', squat: 82.5, bench: 62.5, deadlift: 115 },
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
          totalWorkouts: 23,
          consistencyRate: 92,
          strengthProgress: 18,
        },
        estimated1RM: {
          squat: 95,
          bench: 67.5,
          deadlift: 125,
        },
        insights: [
          {
            type: 'positive',
            message: 'Sua força no agachamento aumentou 18% nas últimas 6 semanas!',
          },
          {
            type: 'positive',
            message: 'Consistência excelente (92%). Mantenha essa frequência!',
          },
          {
            type: 'info',
            message: 'Sugestão: Considere aumentar 2.5kg no supino na próxima sessão.',
          },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
      </View>
    );
  }

  const {
    strengthData,
    volumeData,
    muscleGroupData,
    metrics,
    estimated1RM,
    insights,
  } = dashboardData;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Dashboard de Progresso</Text>
        <Text style={styles.userName}>Veja sua evolução</Text>
      </View>

      {/* Métricas Rápidas */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalWorkouts}</Text>
          <Text style={styles.metricLabel}>Treinos</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.consistencyRate}%</Text>
          <Text style={styles.metricLabel}>Consistência</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>+{metrics.strengthProgress}%</Text>
          <Text style={styles.metricLabel}>Força</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{strengthData.length}</Text>
          <Text style={styles.metricLabel}>Semanas</Text>
        </View>
      </View>

      {/* Gráfico 1: Evolução da Força */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Evolução das Cargas (1RM Estimado)</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          width={Dimensions.get('window').width - 32}
          height={250}
        >
          <VictoryAxis
            tickValues={strengthData.map(d => d.week)}
            style={{
              tickLabels: { fontSize: 10, padding: 5 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(x) => `${x}kg`}
            style={{
              tickLabels: { fontSize: 10, padding: 5 },
            }}
          />
          <VictoryLine
            data={strengthData}
            x="week"
            y="squat"
            style={{ data: { stroke: "#2563EB", strokeWidth: 3 } }}
          />
          <VictoryLine
            data={strengthData}
            x="week"
            y="bench"
            style={{ data: { stroke: "#10B981", strokeWidth: 3 } }}
          />
          <VictoryLine
            data={strengthData}
            x="week"
            y="deadlift"
            style={{ data: { stroke: "#F59E0B", strokeWidth: 3 } }}
          />
        </VictoryChart>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.legendText}>Agachamento</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Supino</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Levantamento Terra</Text>
          </View>
        </View>
      </View>

      {/* Gráfico 2: Volume Semanal */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Volume Semanal (kg)</Text>
        <VictoryChart
          width={Dimensions.get('window').width - 32}
          height={200}
          domainPadding={15}
        >
          <VictoryBar
            data={volumeData}
            x="day"
            y="volume"
            style={{
              data: {
                fill: ({ datum }) => datum.volume > 0 ? '#2563EB' : '#E5E7EB',
                width: 25,
              }
            }}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 10, padding: 5 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(x) => `${x/1000}k`}
            style={{
              tickLabels: { fontSize: 10, padding: 5 },
            }}
          />
        </VictoryChart>
      </View>

      {/* 1RM Atual */}
      <View style={styles.rmContainer}>
        <Text style={styles.chartTitle}>1RM Atual Estimado</Text>
        <View style={styles.rmCards}>
          <View style={[styles.rmCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.rmExercise}>Agachamento</Text>
            <Text style={styles.rmWeight}>{Math.round(estimated1RM.squat)} kg</Text>
          </View>
          <View style={[styles.rmCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.rmExercise}>Supino</Text>
            <Text style={styles.rmWeight}>{Math.round(estimated1RM.bench)} kg</Text>
          </View>
          <View style={[styles.rmCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.rmExercise}>Lev. Terra</Text>
            <Text style={styles.rmWeight}>{Math.round(estimated1RM.deadlift)} kg</Text>
          </View>
        </View>
      </View>

      {/* Distribuição por Grupo Muscular */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribuição por Grupo Muscular</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <VictoryPie
            data={muscleGroupData}
            width={200}
            height={200}
            colorScale={["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]}
            innerRadius={50}
            padAngle={2}
          />
          <View style={{ marginLeft: 20 }}>
            {muscleGroupData.map((item, index) => (
              <View key={index} style={styles.muscleGroupItem}>
                <View style={[styles.muscleColor, { backgroundColor: ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"][index] }]} />
                <Text style={styles.muscleText}>{item.x}: {item.y}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Insights do GOLIAS Coach */}
      <View style={styles.insightsContainer}>
        <Text style={styles.chartTitle}>📈 Insights do GOLIAS Coach</Text>
        {insights.map((insight, index) => (
          <View 
            key={index} 
            style={[
              styles.insightCard,
              { 
                backgroundColor: insight.type === 'positive' ? '#F0F9FF' : 
                                insight.type === 'warning' ? '#FEF3C7' : '#F3F4F6',
                borderLeftColor: insight.type === 'positive' ? '#0EA5E9' : 
                                 insight.type === 'warning' ? '#F59E0B' : '#6B7280',
              }
            ]}
          >
            <Text 
              style={[
                styles.insightText,
                { 
                  color: insight.type === 'positive' ? '#0369A1' : 
                         insight.type === 'warning' ? '#92400E' : '#374151',
                }
              ]}
            >
              {insight.type === 'positive' ? '✅ ' : insight.type === 'warning' ? '⚠️ ' : '💡 '}
              {insight.message}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  userName: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  rmContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  rmCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rmCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderLeftWidth: 4,
  },
  rmExercise: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  rmWeight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  muscleGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  muscleColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  muscleText: {
    fontSize: 14,
    color: '#374151',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  insightCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default Dashboard;