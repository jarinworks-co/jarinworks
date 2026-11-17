// Finishes the GitHub login and hands the token back to the /admin editor.
// Needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Cloudflare Pages → Settings → Variables and Secrets.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const saved = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_state=([^;]+)/);
  if (!code || !saved || saved[1] !== state) {
    return page(url.origin, 'error', { message: 'Login expired. Close this window and try again.' });
  }
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'jarinworks-cms' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) {
    return page(url.origin, 'error', { message: data.error_description || 'GitHub login failed.' });
  }
  return page(url.origin, 'success', { token: data.access_token, provider: 'github' });
}

function page(origin, status, content) {
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Login</title></head><body>
<p style="font-family:system-ui,sans-serif">${status === 'success' ? 'Logged in — you can close this window.' : 'Login failed — close this window and try again.'}</p>
<script>
(function () {
  var origin = ${JSON.stringify(origin)};
  var msg = ${JSON.stringify(msg)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(msg, origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  if (window.opener) window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'oauth_state=; Path=/api; Max-Age=0; Secure; SameSite=Lax' },
  });
}
