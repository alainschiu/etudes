import {useState, useEffect} from 'react';
import {supabase} from './supabase.js';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  // Increments only on real sign-in/sign-out transitions — not on token
  // refreshes or user-update events. Consumers gate one-shot sign-in work
  // (cloud-state pull, conflict check) on this counter instead of `user`,
  // which changes reference on every Supabase auth event.
  const [signInEpoch, setSignInEpoch] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      const u = data?.user ?? null;
      setUser(u);
      if (u) setSignInEpoch(e => e + 1);  // initial page-load sign-in
    });
    const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Bump only on real transitions. INITIAL_SESSION fires alongside the
      // getUser() resolve above and would double-trigger; TOKEN_REFRESHED
      // and USER_UPDATED are not user-initiated transitions.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setSignInEpoch(e => e + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn  = (email, password) => supabase.auth.signInWithPassword({email, password});
  const signUp  = (email, password) => supabase.auth.signUp({email, password});
  const signOut = () => supabase.auth.signOut();
  const signInWithGoogle = () => supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo:window.location.origin}});

  return {user, signInEpoch, signIn, signUp, signOut, signInWithGoogle};
}
