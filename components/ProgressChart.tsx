import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface ProgressChartProps {
  title?: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
}

const ProgressChart: React.FC<ProgressChartProps> = ({ title, data }) => {
  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Azul do tema
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2563EB',
    },
  };

  return (
    <View style={{ marginVertical: 16, borderRadius: 16, padding: 16, backgroundColor: '#f9fafb' }}>
      {title && <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>}
      <LineChart
        data={data}
        width={screenWidth - 32} // from react-native-chart-kit
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          borderRadius: 16,
        }}
      />
    </View>
  );
};

export default ProgressChart;