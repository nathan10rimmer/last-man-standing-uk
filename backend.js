import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT') && !anonKey.includes('YOUR_PUBLIC'));
const client = configured ? createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

const button = document.getElementById('profileBtn');
const originalLabel = button?.textContent || 'Sign in / profile';
let currentUser = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.display = 'block';
    window.setTimeout(() => { toast.style.display = 'none'; }, 3500);
  } else alert(message);
}

function ensureModal() {
  if (document.getElementById('authModal')) return;
  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:100;background:#000b;display:none;align-items:center;justify-content:center;padding:18px';
  modal.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="authTitle" style="width:min(100%,440px);background:#121a15;border:1px solid #354a39;border-radius:18px;padding:24px;color:#f1f6f1;box-shadow:0 20px 70px #0008">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 id="authTitle" style="margin:0;font-size:24px">Your account</h2><button id="authClose" type="button" aria-label="Close" style="background:transparent;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:7px 11px">✕</button></div>
      <p id="authHelp" style="color:#9aab9f;font-size:13px;margin:8px 0 18px">Create an account to keep your leagues and picks synced across devices.</p>
      <form id="authForm" style="display:grid;gap:12px">
        <label style="display:grid;gap:5px;font-size:12px;color:#9aab9f">Display name<input id="authName" autocomplete="nickname" maxlength="40" placeholder="Your name" style="background:#0d140f;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:11px"></label>
        <label style="display:grid;gap:5px;font-size:12px;color:#9aab9f">Email<input id="authEmail" type="email" autocomplete="email" required placeholder="you@example.com" style="background:#0d140f;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:11px"></label>
        <label style="display:grid;gap:5px;font-size:12px;color:#9aab9f">Password<input id="authPassword" type="password" autocomplete="current-password" required minlength="8" placeholder="At least 8 characters" style="background:#0d140f;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:11px"></label>
        <button id="authSubmit" type="submit" style="border:0;border-radius:10px;background:#b7f36b;color:#12200e;font-weight:850;padding:12px">Sign in</button>
      </form>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px"><button id="authMode" type="button" style="background:#18231c;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:10px 12px">Need an account? Sign up</button><button id="authSignOut" type="button" style="display:none;background:transparent;color:#ffb7b7;border:1px solid #593333;border-radius:9px;padding:10px 12px">Sign out</button></div>
      <p style="color:#9aab9f;font-size:11px;margin:16px 0 0">Free-to-play prototype. Real-money payments are disabled. Never share your password with the site administrator.</p>
    </section>`;
  document.body.appendChild(modal);
  const close = () => { modal.style.display = 'none'; };
  modal.querySelector('#authClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#authMode').addEventListener('click', () => {
    const signUp = modal.dataset.mode !== 'signup';
    modal.dataset.mode = signUp ? 'signup' : 'signin';
    modal.querySelector('#authTitle').textContent = signUp ? 'Create your account' : 'Welcome back';
    modal.querySelector('#authSubmit').textContent = signUp ? 'Create account' : 'Sign in';
    modal.querySelector('#authMode').textContent = signUp ? 'Already registered? Sign in' : 'Need an account? Sign up';
    modal.querySelector('#authName').parentElement.style.display = signUp ? 'grid' : 'none';
    modal.querySelector('#authPassword').autocomplete = signUp ? 'new-password' : 'current-password';
  });
  modal.querySelector('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!client) return showToast('Supabase is not configured yet. Follow SETUP.md to connect your project.');
    const email = modal.querySelector('#authEmail').value.trim();
    const password = modal.querySelector('#authPassword').value;
    const displayName = modal.querySelector('#authName').value.trim();
    const signUp = modal.dataset.mode === 'signup';
    const submit = modal.querySelector('#authSubmit');
    submit.disabled = true; submit.textContent = 'Please wait…';
    try {
      const result = signUp
        ? await client.auth.signUp({ email, password, options: { data: { display_name: displayName || email.split('@')[0] } } })
        : await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (signUp && !result.data.session) {
        showToast('Account created. Check your email to confirm it, then sign in.');
      } else {
        showToast(signUp ? 'Account created and signed in.' : 'Signed in successfully.');
        close();
      }
    } catch (err) {
      showToast(err?.message || 'Could not authenticate. Please try again.');
    } finally {
      submit.disabled = false;
      submit.textContent = modal.dataset.mode === 'signup' ? 'Create account' : 'Sign in';
    }
  });
  modal.querySelector('#authSignOut').addEventListener('click', async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) showToast(error.message); else { showToast('Signed out.'); close(); }
  });
}

function updateAccountUI(user) {
  currentUser = user || null;
  if (button) button.textContent = user ? (user.user_metadata?.display_name || user.email || 'My account') : originalLabel;
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.querySelector('#authSignOut').style.display = user ? 'inline-block' : 'none';
    modal.querySelector('#authMode').style.display = user ? 'none' : 'inline-block';
    modal.querySelector('#authForm').style.display = user ? 'none' : 'grid';
    modal.querySelector('#authHelp').textContent = user ? `Signed in as ${user.email}. Account authentication is connected; league data integration is the next step.` : 'Create an account to begin using the connected service.';
    modal.querySelector('#authTitle').textContent = user ? 'Your account' : 'Welcome to Last Man Standing';
  }
}

ensureModal();
if (button) button.addEventListener('click', () => {
  const modal = document.getElementById('authModal');
  if (!configured) {
    modal.style.display = 'flex';
    showToast('Setup needed: connect your Supabase project using SETUP.md.');
    return;
  }
  modal.style.display = 'flex';
  modal.dataset.mode = 'signin';
  modal.querySelector('#authTitle').textContent = currentUser ? 'Your account' : 'Welcome back';
  modal.querySelector('#authSubmit').textContent = 'Sign in';
  modal.querySelector('#authName').parentElement.style.display = 'none';
  modal.querySelector('#authMode').textContent = 'Need an account? Sign up';
  modal.querySelector('#authMode').style.display = currentUser ? 'none' : 'inline-block';
  modal.querySelector('#authForm').style.display = currentUser ? 'none' : 'grid';
  modal.querySelector('#authSignOut').style.display = currentUser ? 'inline-block' : 'none';
  modal.querySelector('#authHelp').textContent = currentUser ? `Signed in as ${currentUser.email}.` : 'Sign in or create an account to get started.';
});

if (!configured) {
  console.info('[LMS] Supabase not configured. Demo remains in local-only mode.');
} else {
  client.auth.getSession().then(({ data, error }) => {
    if (error) console.error('[LMS] Session check failed:', error.message);
    updateAccountUI(data?.session?.user || null);
  });
  client.auth.onAuthStateChange((_event, session) => updateAccountUI(session?.user || null));
  window.lmsSupabase = client;
  window.lmsBackendStatus = 'auth-connected';
}
