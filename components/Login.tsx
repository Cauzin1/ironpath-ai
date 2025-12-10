import React, { useState } from 'react';
import { DumbbellIcon } from './icons';
// Verifique se o caminho está correto. Sugiro padronizar para '../lib/supabaseClient' se seguiu o tutorial anterior.
import { supabase } from '../supaBaseClient'; 

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // --- LÓGICA DE CADASTRO CORRIGIDA ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Se o "Confirm Email" estiver DESATIVADO no Supabase, data.session virá preenchido
        if (data.session) {
            setMessage({ type: 'success', text: 'Cadastro realizado! Entrando...' });
            // O componente App.tsx detectará a sessão automaticamente e mudará a tela
        } else {
            // Caso contrário (se ainda precisar confirmar)
            setMessage({ type: 'success', text: 'Cadastro realizado! Se necessário, verifique seu email.' });
        }

      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
        
        <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
                <DumbbellIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="w-12 h-12 text-white">GOL</span>
              <span className="w-12 h-12 text-indigo-400 ">IA</span>
              <span className="w-12 h-12 text-white">S</span>
            </h1>
        </div>
        
        <form onSubmit={handleAuth} className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder-gray-500"
                placeholder="••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 border rounded-lg text-sm text-center font-medium ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg disabled:opacity-70 flex justify-center items-center active:scale-95"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isSignUp ? 'Cadastrar e Entrar' : 'Entrar')}
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