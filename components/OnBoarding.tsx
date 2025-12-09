import React, { useState } from 'react';
import { supabase } from '../supaBaseClient';
import { DumbbellIcon } from './icons';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'masculino',
    experience_level: 'iniciante',
    goal: 'hipertrofia'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('profiles').insert({
      user_id: userId,
      age: parseInt(formData.age),
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      gender: formData.gender,
      experience_level: formData.experience_level,
      goal: formData.goal
    });

    if (error) {
      alert('Erro ao salvar perfil. Tente novamente.');
      setLoading(false);
    } else {
      onComplete(); // Avisa o MainApp que acabou
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <DumbbellIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Perfil do Atleta</h1>
          <p className="text-gray-400 mt-2">Precisamos conhecer você para calibrar a IA.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5 shadow-2xl">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Idade</label>
              <input name="age" type="number" required placeholder="Anos" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sexo</label>
              <select name="gender" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none">
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Peso (kg)</label>
              <input name="weight" type="number" step="0.1" required placeholder="Ex: 75.5" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Altura (cm)</label>
              <input name="height" type="number" required placeholder="Ex: 175" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nível de Experiência</label>
            <select name="experience_level" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none">
              <option value="iniciante">Iniciante (Menos de 6 meses)</option>
              <option value="intermediario">Intermediário (6 meses a 2 anos)</option>
              <option value="avancado">Avançado (Mais de 2 anos)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Objetivo Principal</label>
            <select name="goal" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none">
              <option value="hipertrofia">Hipertrofia (Ganhar Músculo)</option>
              <option value="emagrecimento">Emagrecimento (Perder Gordura)</option>
              <option value="forca">Ganho de Força Pura</option>
              <option value="resistencia">Resistência</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg mt-4 flex justify-center items-center"
          >
            {loading ? 'Salvando...' : 'Finalizar Cadastro'}
          </button>

        </form>
      </div>
    </div>
  );
};