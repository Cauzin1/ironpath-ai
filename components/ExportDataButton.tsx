import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';

interface ExportDataButtonProps {
  data?: any;
}

const ExportDataButton: React.FC<ExportDataButtonProps> = ({ data }) => {
  const exportData = async () => {
    try {
      // Em ambiente web, podemos usar a API de download
      if (typeof window !== 'undefined') {
        const jsonString = JSON.stringify(data || {}, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `golias-progress-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Alert.alert('Sucesso', 'Dados exportados com sucesso!');
      } else {
        // Em React Native, você precisaria de uma biblioteca como react-native-fs
        Alert.alert('Aviso', 'Exportação disponível apenas na versão web.');
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      Alert.alert('Erro', 'Não foi possível exportar os dados');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={exportData}>
      <Text style={styles.buttonText}>📤 Exportar Dados</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ExportDataButton;