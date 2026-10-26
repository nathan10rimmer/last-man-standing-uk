import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const configured = Boolean(
  url &&
  anonKey &&
  !url.includes('YOUR_PROJECT') &&
  !anonKey.includes('YOUR_PUBLIC')
);

const client = configured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const profileButton = document.getElementById('profileBtn');

function showMessage(message) {
  const toast = document.getElementById('toast');

  if (toast) {
    toast.textContent = message;
    toast.style.display = 'block';
  } else {
    alert(message);
  }
}

if (profileButton) {
  profileButton.addEventListener('click', async () => {
    if (!client) {
      showMessage('Account setup is not connected yet.');
      return;
    }

    const { data } = await client.auth.getSession();

    if (data.session) {
      showMessage(`Signed in as ${data.session.user.email}`);
    } else {
      showMessage('Account sign-in screen is the next step to connect.');
    }
  });
}

window.lmsSupabase = client;
window.lmsBackendStatus = configured
  ? 'connected'
  : 'awaiting-configuration';

console.info(
  '[LMS] Backend status:',
  window.lmsBackendStatus
);
