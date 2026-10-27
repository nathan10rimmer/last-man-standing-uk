import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(url && publishableKey && !url.includes('YOUR_PROJECT') && !publishableKey.includes('YOUR_PUBLIC'));
const client = configured ? createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

const button = document.getElementById('profileBtn');
const originalLabel = button?.textContent || 'Sign in / profile';
let currentUser = null;
let signUpMode = false;

function notify(message) {
  const toast = document.getElementById('toast');
  if (!toast) { alert(message); return; }
  toast.textContent = message;
  toast.style.display = 'block';
  window.clearTimeout(window.__lmsToastTimer);
  window.__lmsToastTimer = window.setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function ensureModal() {
  if (document.getElementById('lmsAuthModal')) return;
  const modal = document.createElement('div');
  modal.id = 'lmsAuthModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:100;background:#000b;display:none;align-items:center;justify-content:center;padding:18px';
  modal.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="lmsAuthTitle" style="width:min(100%,440px);background:#121a15;border:1px solid #354a39;border-radius:18px;padding:24px;color:#f1f6f1;box-shadow:0 20px 70px #0008">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 id="lmsAuthTitle" style="margin:0;font-size:24px">Welcome back</h2><button id="lmsAuthClose" type="button" aria-label="Close" style="background:transparent;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:7px 11px">✕</button></div>
      <p id="lmsAuthHelp" style="color:#9aab9f;font-size:13px;margin:8px 0 18px">Sign in or create an account.</p>
      <form id="lmsAuthForm" style="display:grid;gap:12px">
        <label id="lmsNameWrap" style="display:none;gap:5px;font-size:12px;color:#9aab9f">Display name<input id="lmsAuthName" autocomplete="nickname" maxlength="40" placeholder="Your name" style="background:#0d140f;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:11px"></label>
        <label style="display:grid;gap:5px;font-size:12px;color:#9aab9f">Email<input id="lmsAuthEmail" type="email" autocomplete="email" required placeholder="you@example.com" style="background:#0d140f;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:11px"></label>
        <label style="display:grid;gap:5px;font-size:12px;color:#9aab9f">Password<input id="lmsAuthPassword" type="password" autocomplete="current-password" required minlength="8" placeholder="At least 8 characters" style="background:#0d140f;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:11px"></label>
        <button id="lmsAuthSubmit" type="submit" style="border:0;border-radius:10px;background:#b7f36b;color:#12200e;font-weight:850;padding:12px">Sign in</button>
      </form>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px"><button id="lmsAuthMode" type="button" style="background:#18231c;color:#f1f6f1;border:1px solid #28382d;border-radius:9px;padding:10px 12px">Need an account? Sign up</button><button id="lmsAuthSignOut" type="button" style="display:none;background:transparent;color:#ffb7b7;border:1px solid #593333;border-radius:9px;padding:10px 12px">Sign out</button></div>
      <p style="color:#9aab9f;font-size:11px;margin:16px 0 0">Free-to-play beta. Never share your password with anyone. League and pick syncing is not enabled yet.</p>
    </section>`;
  document.body.appendChild(modal);
  const $ = selector => modal.querySelector(selector);
  const close = () => { modal.style.display = 'none'; };
  $('#lmsAuthClose').addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  $('#lmsAuthMode').addEventListener('click', () => {
    signUpMode = !signUpMode;
    $('#lmsAuthTitle').textContent = signUpMode ? 'Create your account' : 'Welcome back';
    $('#lmsAuthSubmit').textContent = signUpMode ? 'Create account' : 'Sign in';
    $('#lmsAuthMode').textContent = signUpMode ? 'Already registered? Sign in' : 'Need an account? Sign up';
    $('#lmsNameWrap').style.display = signUpMode ? 'grid' : 'none';
    $('#lmsAuthPassword').autocomplete = signUpMode ? 'new-password' : 'current-password';
  });
  $('#lmsAuthForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return notify('Supabase is not configured. Check the Vercel environment variables.');
    const email = $('#lmsAuthEmail').value.trim();
    const password = $('#lmsAuthPassword').value;
    const displayName = $('#lmsAuthName').value.trim() || email.split('@')[0];
    const submit = $('#lmsAuthSubmit');
    submit.disabled = true; submit.textContent = 'Please wait…';
    try {
      const result = signUpMode
        ? await client.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
        : await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (signUpMode && !result.data.session) {
        notify('Account created. Check your email to confirm it, then sign in.');
      } else {
        notify(signUpMode ? 'Account created and signed in.' : 'Signed in successfully.');
        close();
      }
    } catch (error) {
      notify(error?.message || 'Authentication failed. Please try again.');
    } finally {
      submit.disabled = false;
      submit.textContent = signUpMode ? 'Create account' : 'Sign in';
    }
  });
  $('#lmsAuthSignOut').addEventListener('click', async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) notify(error.message); else { notify('Signed out.'); close(); }
  });
}

function updateAccount(user) {
  currentUser = user || null;
  if (button) button.textContent = user ? (user.user_metadata?.display_name || user.email || 'My account') : originalLabel;
  const modal = document.getElementById('lmsAuthModal');
  if (!modal) return;
  modal.querySelector('#lmsAuthSignOut').style.display = user ? 'inline-block' : 'none';
  modal.querySelector('#lmsAuthMode').style.display = user ? 'none' : 'inline-block';
  modal.querySelector('#lmsAuthForm').style.display = user ? 'none' : 'grid';
  modal.querySelector('#lmsAuthHelp').textContent = user
    ? `Signed in as ${user.email}. Shared leagues and picks are the next integration step.`
    : 'Create an account or sign in to start using your account.';
  modal.querySelector('#lmsAuthTitle').textContent = user ? 'Your account' : 'Welcome back';
}

ensureModal();
if (button) button.addEventListener('click', () => {
  const modal = document.getElementById('lmsAuthModal');
  if (!configured) notify('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
  signUpMode = false;
  modal.querySelector('#lmsAuthTitle').textContent = currentUser ? 'Your account' : 'Welcome back';
  modal.querySelector('#lmsAuthMode').textContent = 'Need an account? Sign up';
  modal.querySelector('#lmsNameWrap').style.display = 'none';
  modal.querySelector('#lmsAuthSubmit').textContent = 'Sign in';
  modal.querySelector('#lmsAuthForm').style.display = currentUser ? 'none' : 'grid';
  modal.querySelector('#lmsAuthMode').style.display = currentUser ? 'none' : 'inline-block';
  modal.querySelector('#lmsAuthSignOut').style.display = currentUser ? 'inline-block' : 'none';
  modal.querySelector('#lmsAuthHelp').textContent = currentUser ? `Signed in as ${currentUser.email}.` : 'Sign in or create an account.';
  modal.style.display = 'flex';
});

window.lmsSupabase = client;
window.lmsBackendStatus = configured ? 'auth-ready' : 'awaiting-configuration';
if (client) {
  client.auth.getSession().then(({ data, error }) => {
    if (error) console.error('[LMS] Session check failed:', error.message);
    updateAccount(data?.session?.user || null);
  });
  client.auth.onAuthStateChange((_event, session) => updateAccount(session?.user || null));
}
console.info('[LMS] Backend status:', window.lmsBackendStatus);
