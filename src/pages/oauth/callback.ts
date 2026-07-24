/**
 * Step 2 of the CMS login: exchange the GitHub code for a token and hand it
 * back to the CMS window via the standard Decap/Sveltia postMessage handshake.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID ?? import.meta.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret =
    process.env.OAUTH_GITHUB_CLIENT_SECRET ?? import.meta.env.OAUTH_GITHUB_CLIENT_SECRET;

  let payload: string;
  if (!code || !clientId || !clientSecret) {
    payload = `error:${JSON.stringify({ error: 'OAuth is not configured' })}`;
  } else {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await res.json();
    payload = data.error
      ? `error:${JSON.stringify({ error: data.error_description ?? data.error })}`
      : `success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`;
  }

  const html = `<!doctype html>
<html>
  <body>
    <p>Signing in…</p>
    <script>
      (function () {
        function receiveMessage() {
          window.opener.postMessage('authorization:github:${payload.replace(/'/g, "\\'")}', '*');
        }
        window.addEventListener('message', receiveMessage, { once: true });
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};
