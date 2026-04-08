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

  const isProf = selectedRole === 'professor';

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
        await supabase.auth.updateUser({ data: { selectedRole } });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-[#080810]">

      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: isProf
            ? 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(20,184,166,0.10) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.20) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(139,92,246,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={`relative p-4 rounded-2xl mb-5 transition-all duration-500 ${
              isProf
                ? 'bg-emerald-500/15 border border-emerald-500/25 shadow-[0_0_40px_rgba(16,185,129,0.25)]'
                : 'bg-indigo-500/15 border border-indigo-500/25 shadow-[0_0_40px_rgba(99,102,241,0.25)]'
            }`}
          >
            <DumbbellIcon className={`w-10 h-10 transition-colors duration-500 ${isProf ? 'text-emerald-400' : 'text-indigo-400'}`} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Golias<span className={`transition-colors duration-500 ${isProf ? 'text-emerald-400' : 'text-indigo-400'}`}>Fit</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">Seu app de treino inteligente</p>
        </div>

        {/* Role selector */}
        <div className="mb-5">
          <p className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest mb-3">Você é…</p>
          <div className="flex gap-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setSelectedRole('aluno')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                selectedRole === 'aluno'
                  ? 'bg-indigo-600 text-white shadow-[0_2px_16px_rgba(99,102,241,0.40)]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>💪</span> Aluno
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('professor')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                selectedRole === 'professor'
                  ? 'bg-emerald-600 text-white shadow-[0_2px_16px_rgba(16,185,129,0.40)]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>🎓</span> Professor
            </button>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleAuth}
          className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-7 space-y-5"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 ml-0.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full bg-white/[0.06] border border-white/[0.10] rounded-xl py-3.5 px-4 text-white outline-none placeholder-gray-600 text-sm transition-all duration-200 ${
                  isProf
                    ? 'focus:border-emerald-500/60 focus:bg-emerald-500/5 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                    : 'focus:border-indigo-500/60 focus:bg-indigo-500/5 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                }`}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 ml-0.5 uppercase tracking-wider">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full bg-white/[0.06] border border-white/[0.10] rounded-xl py-3.5 px-4 text-white outline-none placeholder-gray-600 text-sm transition-all duration-200 ${
                  isProf
                    ? 'focus:border-emerald-500/60 focus:bg-emerald-500/5 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                    : 'focus:border-indigo-500/60 focus:bg-indigo-500/5 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`px-4 py-3 border rounded-xl text-sm text-center font-medium ${
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
            className={`w-full text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 disabled:opacity-60 flex justify-center items-center active:scale-[0.98] ${
              isProf
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_30px_rgba(16,185,129,0.50)]'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_30px_rgba(99,102,241,0.50)]'
            }`}
          >
            {isLoading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isSignUp ? 'Criar Conta' : 'Entrar'
            }
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          {isSignUp ? 'Já tem conta?' : 'Não tem uma conta?'}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className={`ml-2 font-semibold hover:underline bg-transparent border-none cursor-pointer transition-colors ${
              isProf ? 'text-emerald-500 hover:text-emerald-400' : 'text-indigo-400 hover:text-indigo-300'
            }`}
          >
            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>
    </div>
  );
};
