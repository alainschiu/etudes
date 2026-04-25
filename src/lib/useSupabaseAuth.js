import {useState, useEffect} from 'react';
import {supabase} from './supabase.js';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data?.user ?? null));
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn  = (email, password) => supabase.auth.signInWithPassword({email, password});
  const signUp  = (email, password) => supabase.auth.signUp({email, password});
  const signOut = () => supabase.auth.signOut();

  return {user, signIn, signUp, signOut};
}
