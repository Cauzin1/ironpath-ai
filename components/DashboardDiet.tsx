import { useState } from 'react';
import { Upload, Calendar, Bell, Settings } from 'lucide-react';
import DietUpload from '../components/UploadPDFDiet';
import DailyDiet from '../components/DailyDiet';

export default function DashboardDiet() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'diet' | 'upload'>('diet');

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="min-h-screen bg-gray-900 pb-24">

      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">Minha Dieta</h1>
            <p className="text-xs text-gray-400 capitalize">{formatDate(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-gray-800 rounded-full border border-gray-700 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 bg-gray-800 rounded-full border border-gray-700 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Seletor de data */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              Hoje
            </button>
          )}
        </div>

        {/* Tab de navegação */}
        <div className="flex mt-3 bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveView('diet')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'diet'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Refeições do Dia
          </button>
          <button
            onClick={() => setActiveView('upload')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'upload'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Importar Dieta
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-4">
        {activeView === 'diet' ? (
          <DailyDiet selectedDate={selectedDate} />
        ) : (
          <DietUpload />
        )}
      </div>
    </div>
  );
}
