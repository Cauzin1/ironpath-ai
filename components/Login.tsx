import React, { useState } from 'react';
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
            <svg
              viewBox="0 0 64 64"
              className={`w-10 h-10 transition-colors duration-500 ${isProf ? 'text-emerald-400' : 'text-indigo-400'}`}
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Helmet crest / plume */}
              <path d="M20 2 C20 2 18 8 22 12 L24 12 C22 8 24 4 32 4 C40 4 42 8 40 12 L42 12 C46 8 44 2 44 2 L40 2 C40 2 38 5 32 5 C26 5 24 2 24 2 Z" />
              {/* Crest feathers */}
              <rect x="30" y="1" width="4" height="11" rx="2" />
              {/* Helmet dome */}
              <path d="M18 28 C18 18 22 12 32 12 C42 12 46 18 46 28 L44 28 C44 19 40 14 32 14 C24 14 20 19 20 28 Z" />
              {/* Visor / face guard */}
              <path d="M20 28 L44 28 L44 33 C44 36 40 38 32 38 C24 38 20 36 20 33 Z" />
              {/* Eye slit */}
              <rect x="22" y="29" width="20" height="2" rx="1" opacity="0.4" fill="var(--tw-prose-body, #080810)" />
              {/* Cheek guards */}
              <path d="M20 28 L18 28 L17 36 C17 38 19 40 22 40 L22 38 C20 38 19 37 20 36 Z" />
              <path d="M44 28 L46 28 L47 36 C47 38 45 40 42 40 L42 38 C44 38 45 37 44 36 Z" />
              {/* Neck guard */}
              <path d="M22 38 L42 38 L43 42 L21 42 Z" />
              {/* Shield (left arm) */}
              <path d="M6 34 C4 34 3 36 3 38 L3 54 C3 57 5 59 8 60 L14 62 L14 32 L8 32 C7 32 6 33 6 34 Z" />
              <path d="M5 42 L13 42 L13 44 L5 44 Z" opacity="0.5" />
              {/* Body / torso */}
              <path d="M22 42 L42 42 L44 52 L20 52 Z" />
              {/* Sword (right arm raised) */}
              <path d="M50 6 L52 4 L54 6 L52 8 Z" />
              <rect x="51" y="8" width="2" height="26" rx="1" />
              <rect x="47" y="28" width="10" height="2" rx="1" />
              {/* Legs */}
              <path d="M22 52 L28 52 L27 62 L21 62 Z" />
              <path d="M36 52 L42 52 L43 62 L37 62 Z" />
            </svg>
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
