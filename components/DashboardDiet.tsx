// DashboardLayout.jsx
import { useState } from 'react';
import { Upload, Calendar, User, Bell, Settings } from 'lucide-react';
import DietUpload from '../components/UploadPDFDiet';
import DailyDiet from '../components/DailyDiet';
import MealSchedule from '../components/MealSchedule';

export default function DashboardDiet() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">🏋️‍♂️ FitTracker</h1>
            <div className="relative">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload de PDF */}
        <div className="lg:col-span-1">
          <DietUpload />
        </div>

        {/* Dieta do Dia */}
        <div className="lg:col-span-2">
          <DailyDiet selectedDate={selectedDate} />
        </div>

        {/* Cronograma de Refeições */}
        {/* <div className="lg:col-span-3">
          <MealSchedule selectedDate={selectedDate} />
        </div> */}
      </div>
    </div>
  );
}