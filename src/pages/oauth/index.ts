/**
 * Step 1 of the CMS login: send the admin to GitHub's authorize screen.
 * Requires OAUTH_GITHUB_CLIENT_ID / OAUTH_GITHUB_CLIENT_SECRET env vars on Vercel.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ url, redirect }) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID ?? import.meta.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('OAUTH_GITHUB_CLIENT_ID is not configured', { status: 500 });
  }

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', `${url.origin}/oauth/callback`);
  authUrl.searchParams.set('scope', 'repo,user');

  return redirect(authUrl.toString(), 302);
};
