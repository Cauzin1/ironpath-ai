import { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login';
import { MainApp } from './components/MainApp';
import { TrainerApp } from './components/TrainerApp';
import { Onboarding } from './components/OnBoarding';
import { supabase } from './supaBaseClient';
import { Session } from '@supabase/supabase-js';

const Spinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
  </div>
);

// session === undefined → ainda carregando
// session === null     → não logado
// session === Session  → logado
function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Spinner />;
  if (!session) return <Login />;
  return <AuthenticatedApp session={session} />;
}

// ─── AuthenticatedApp ────────────────────────────────────────────────────────
// Responsável por determinar o papel do usuário e exibir o ambiente correto.
// Fluxo:
//   undefined → buscando papel no banco
//   null      → sem perfil → exibe Onboarding (escolha de papel + formulário)
//   'aluno'   → MainApp
//   'professor'→ TrainerApp
const AuthenticatedApp: React.FC<{ session: Session }> = ({ session }) => {
  const [role, setRole] = useState<'aluno' | 'professor' | null | undefined>(undefined);

  const fetchRole = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (error) throw error;
      setRole((data?.role as 'aluno' | 'professor') ?? null);
    } catch {
      setRole(null);
    }
  }, [session.user.id]);

  useEffect(() => { fetchRole(); }, [fetchRole]);

  if (role === undefined) return <Spinner />;

  // Sem perfil → Onboarding centralizado aqui.
  // onComplete chama fetchRole() — sem reload, transição direta para o ambiente certo.
  if (role === null) {
    return (
      <Onboarding
        userId={session.user.id}
        initialRole={session.user.user_metadata?.selectedRole}
        onComplete={fetchRole}
      />
    );
  }

  if (role === 'professor') return <TrainerApp session={session} />;
  return <MainApp session={session} />;
};

export default App;
