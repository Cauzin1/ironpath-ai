import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { MainApp } from './components/MainApp';
import { supabase } from './supaBaseClient';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Escutar mudanças (Login, Logout, Expiração)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {session ? (
        <MainApp session={session} />
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;