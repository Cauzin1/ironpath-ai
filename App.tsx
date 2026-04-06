import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { MainApp } from './components/MainApp';
import { supabase } from './supaBaseClient';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <MainApp session={session} />;
}

export default App;
