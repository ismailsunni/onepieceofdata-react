import { supabase } from './supabase'

export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return { data: { session: null } }
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback: (session: any) => void) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}
