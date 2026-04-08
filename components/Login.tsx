import React, { useState } from 'react';
import { DumbbellIcon } from './icons';
import { supabase } from '../supaBaseClient';

type Role = 'aluno' | 'professor';

export const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('aluno');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp]   = useState(false);
  const [message, setMessage]     = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { selectedRole } },
        });
        if (error) throw error;
        if (data.session) {
          setMessage({ type: 'success', text: 'Cadastro realizado! Entrando...' });
        } else {
          setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu email se necessário.' });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black">
      <div className="w-full max-w-md animate-fade-in-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <DumbbellIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">GOL</span>
            <span className="text-indigo-400">IA</span>
            <span className="text-white">S</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Seu app de treino inteligente</p>
        </div>

        {/* Seletor de papel */}
        <div className="flex gap-2 mb-4 bg-gray-800/60 border border-gray-700/50 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole('aluno')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              selectedRole === 'aluno'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>💪</span> Sou Aluno
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('professor')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              selectedRole === 'professor'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🎓</span> Sou Professor
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAuth} className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder-gray-500"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder-gray-500"
                placeholder="••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 border rounded-lg text-sm text-center font-medium ${
              message.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg disabled:opacity-70 flex justify-center items-center active:scale-95 ${
              selectedRole === 'professor'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isLoading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isSignUp ? 'Cadastrar e Entrar' : 'Entrar'
            }
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isSignUp ? 'Já tem conta?' : 'Não tem uma conta?'}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="ml-2 text-indigo-400 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};
