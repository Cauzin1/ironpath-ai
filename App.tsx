import { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login';
import { MainApp } from './components/MainApp';
import { TrainerApp } from './components/TrainerApp';
import { supabase } from './supaBaseClient';
import { Session } from '@supabase/supabase-js';

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

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Login />;

  return <AuthenticatedApp session={session} />;
}

// Componente separado para evitar re-montar durante mudanças de sessão
const AuthenticatedApp: React.FC<{ session: Session }> = ({ session }) => {
  // undefined = buscando | null = sem perfil (novo usuário) | 'aluno' | 'professor'
  const [role, setRole] = useState<'aluno' | 'professor' | null | undefined>(undefined);

  const fetchRole = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      setRole((data?.role as 'aluno' | 'professor') ?? null);
    } catch {
      setRole(null);
    }
  }, [session.user.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  if (role === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (role === 'professor') return <TrainerApp session={session} />;

  // role === 'aluno' ou null → MainApp mostra Onboarding se sem perfil
  return <MainApp session={session} onRoleChange={fetchRole} />;
};

export default App;
