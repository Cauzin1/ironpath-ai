import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { MainApp } from './components/MainApp';
import { TrainerApp } from './components/TrainerApp';
import { supabase } from './supaBaseClient';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // undefined = ainda não verificado | null = sem perfil (novo usuário) | 'aluno' | 'professor'
  const [role, setRole] = useState<'aluno' | 'professor' | null | undefined>(undefined);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      setRole((data?.role as 'aluno' | 'professor') ?? null);
    } catch {
      setRole(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setRole(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || role === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Login />;
  if (role === 'professor') return <TrainerApp session={session} />;

  // role === 'aluno' ou null (novo usuário → MainApp exibe Onboarding)
  return <MainApp session={session} onRoleChange={() => fetchRole(session.user.id)} />;
}

export default App;
