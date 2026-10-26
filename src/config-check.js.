export function supabaseConfigured(env = import.meta.env) {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY &&
    !env.VITE_SUPABASE_URL.includes('YOUR_PROJECT') &&
    !env.VITE_SUPABASE_ANON_KEY.includes('YOUR_PUBLIC'));
}
