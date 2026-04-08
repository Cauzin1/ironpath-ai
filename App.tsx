import { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login';
import { MainApp } from './components/MainApp';
import { TrainerApp } from './components/TrainerApp';
import { Onboarding } from './components/OnBoarding';
import { supabase } from './supaBaseClient';
import { Session } from '@supabase/supabase-js';

const Spinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
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
      // data === null → usuário sem perfil → Onboarding
      // data.role === 'aluno'/'professor' → rota correta
      setRole((data?.role as 'aluno' | 'professor') ?? null);
    } catch {
      // Erro real (RLS, rede, tabela inexistente) — tenta usar metadata como fallback
      const metaRole = session.user.user_metadata?.selectedRole;
      if (metaRole === 'professor' || metaRole === 'aluno') {
        setRole(metaRole);
      } else {
        // Não sabe o papel e não conseguiu buscar → desloga para evitar
        // loop onde usuário fica preso no Onboarding em vez de ver o Login
        await supabase.auth.signOut();
      }
    }
  }, [session.user.id, session.user.user_metadata?.selectedRole]);

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
        onSignOut={() => supabase.auth.signOut()}
      />
    );
  }

  if (role === 'professor') return <TrainerApp session={session} />;
  return <MainApp session={session} />;
};

export default App;
