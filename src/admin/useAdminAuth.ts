import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Real admin login via Supabase Auth (email + password). Being signed in is not enough: the email must
// also be in the public.admins table, which the database checks with is_admin() — the same function the
// row-level-security policies use for writes.
export type AdminAuthStatus = 'loading' | 'signedOut' | 'notAdmin' | 'admin' | 'recovery';

// Password-reset links land on /admin/ with the recovery token in the URL
const isRecoveryUrl = () => /type=recovery/.test(window.location.hash + window.location.search);

export const useAdminAuth = () => {
  const [status, setStatus] = useState<AdminAuthStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);
  // Stay on the "set new password" screen until the user has actually set one
  const inRecovery = useRef(isRecoveryUrl());

  const evaluate = useCallback(async (session: Session | null) => {
    setEmail(session?.user.email ?? null);
    if (!session) {
      setStatus(inRecovery.current ? 'loading' : 'signedOut');
      return;
    }
    if (inRecovery.current) {
      setStatus('recovery');
      return;
    }
    const { data, error } = await supabase.rpc('is_admin');
    setStatus(!error && data === true ? 'admin' : 'notAdmin');
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) evaluate(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') inRecovery.current = true;
      if (event === 'TOKEN_REFRESHED') return;
      // supabase-js warns against awaiting other Supabase calls inside this callback
      setTimeout(() => {
        if (active) evaluate(session);
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [evaluate]);

  const signIn = async (signInEmail: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail.trim(), password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
  };

  const sendPasswordReset = async (resetEmail: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/admin/`,
    });
    if (error) throw new Error(error.message);
  };

  const setNewPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    inRecovery.current = false;
    window.history.replaceState({}, '', '/admin/'); // drop the token from the URL
    const { data } = await supabase.auth.getSession();
    await evaluate(data.session);
  };

  const signOut = async () => {
    inRecovery.current = false;
    await supabase.auth.signOut();
  };

  return { status, email, signIn, sendPasswordReset, setNewPassword, signOut };
};
