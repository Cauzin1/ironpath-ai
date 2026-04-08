import React, { useState } from 'react';
import { supabase } from '../supaBaseClient';
import { DumbbellIcon } from './icons';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
  initialRole?: string;
}

type Role = 'aluno' | 'professor';

// ─── Step 1: Seleção de papel ─────────────────────────────────────────────────
const RoleSelection: React.FC<{ onSelect: (r: Role) => void }> = ({ onSelect }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-10">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <DumbbellIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">IronPath AI</h1>
        <p className="text-gray-400 mt-2">Como você vai usar o app?</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onSelect('aluno')}
          className="w-full bg-gray-800 border-2 border-gray-700 hover:border-indigo-500 hover:bg-gray-800/80 active:scale-95 transition-all rounded-2xl p-6 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-indigo-600/30 transition-colors">
              💪
            </div>
            <div>
              <p className="text-white font-bold text-lg">Sou Aluno</p>
              <p className="text-gray-400 text-sm mt-0.5">Quero treinar e acompanhar minha evolução</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect('professor')}
          className="w-full bg-gray-800 border-2 border-gray-700 hover:border-emerald-500 hover:bg-gray-800/80 active:scale-95 transition-all rounded-2xl p-6 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-emerald-600/30 transition-colors">
              🎓
            </div>
            <div>
              <p className="text-white font-bold text-lg">Sou Professor</p>
              <p className="text-gray-400 text-sm mt-0.5">Quero criar treinos e gerenciar meus alunos</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
);

// ─── Step 2: Formulário do Aluno ──────────────────────────────────────────────
const StudentForm: React.FC<{ userId: string; onComplete: () => void }> = ({ userId, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'masculino',
    experience_level: 'iniciante',
    goal: 'hipertrofia',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        gender: formData.gender,
        experience_level: formData.experience_level,
        goal: formData.goal,
        role: 'aluno',
      });
      if (profileError) throw profileError;

      const name = formData.name.trim();
      if (name) {
        await supabase.auth.updateUser({ data: { full_name: name } });
      }
      onComplete();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar perfil. Tente novamente.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💪</div>
          <h1 className="text-2xl font-bold text-white">Perfil do Aluno</h1>
          <p className="text-gray-400 mt-1">Precisamos conhecer você para calibrar a IA.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome</label>
            <input name="name" type="text" required placeholder="Seu nome" onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Idade</label>
              <input name="age" type="number" inputMode="numeric" required placeholder="Anos" onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sexo</label>
              <select name="gender" onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none">
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Peso (kg)</label>
              <input name="weight" type="number" inputMode="decimal" step="0.1" required placeholder="Ex: 75.5" onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Altura (cm)</label>
              <input name="height" type="number" inputMode="numeric" required placeholder="Ex: 175" onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
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

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center min-h-[44px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Step 2: Formulário do Professor ─────────────────────────────────────────
const ProfessorForm: React.FC<{ userId: string; onComplete: () => void }> = ({ userId, onComplete }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        age: 0,
        weight: 0,
        height: 0,
        gender: '',
        experience_level: '',
        goal: '',
        role: 'professor',
      });
      if (profileError) throw profileError;
      await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      onComplete();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar perfil. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-white">Perfil do Professor</h1>
          <p className="text-gray-400 mt-1">Como seus alunos irão te identificar?</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seu Nome</label>
            <input
              type="text"
              required
              placeholder="Ex: Professor Carlos"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center min-h-[44px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete, initialRole }) => {
  const preselected = initialRole === 'professor' || initialRole === 'aluno' ? initialRole as Role : null;
  const [step, setStep] = useState<1 | 2>(preselected ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(preselected);

  if (step === 1) {
    return (
      <RoleSelection
        onSelect={role => {
          setSelectedRole(role);
          setStep(2);
        }}
      />
    );
  }

  if (selectedRole === 'professor') {
    return <ProfessorForm userId={userId} onComplete={onComplete} />;
  }

  return <StudentForm userId={userId} onComplete={onComplete} />;
};
