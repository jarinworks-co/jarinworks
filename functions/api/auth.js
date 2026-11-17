// Starts the GitHub login for the /admin editor (Decap CMS).
// Needs GITHUB_CLIENT_ID set in Cloudflare Pages → Settings → Variables and Secrets.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const gh = new URL('https://github.com/login/oauth/authorize');
  gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  gh.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
  gh.searchParams.set('scope', 'repo,user');
  gh.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: gh.toString(),
      'Set-Cookie': `oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
