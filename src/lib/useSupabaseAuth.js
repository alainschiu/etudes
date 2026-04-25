import {useState, useEffect} from 'react';
import {supabase} from './supabase.js';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({data}) => setUser(data?.user ?? null));
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn  = (email, password) => supabase ? supabase.auth.signInWithPassword({email, password}) : Promise.resolve({error:{message:'Sync not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'}});
  const signUp  = (email, password) => supabase ? supabase.auth.signUp({email, password}) : Promise.resolve({error:{message:'Sync not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'}});
  const signOut = () => supabase ? supabase.auth.signOut() : Promise.resolve({});

  return {user, signIn, signUp, signOut};
}
