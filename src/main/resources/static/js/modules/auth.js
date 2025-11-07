import { api } from './util.js';

/**
 * Register a new user using the server API.
 * Returns the parsed JSON response on success.
 * @param {{username:string, displayName:string, email:string, password:string}} payload
 */
export async function register(payload) {
  // send registration request to server
  const res = await api('/api/register', { method: 'POST', body: payload });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

/**
 * Login using username/password; server creates the session.
 * Returns parsed JSON on success.
 * @param {{username:string,password:string}} creds
 */
export async function login(creds) {
  const res = await api('/api/login', { method: 'POST', body: creds });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

/**
 * Logout the current session on the server side.
 */
export async function logout() {
  await api('/api/logout', { method: 'POST' });
}

/**
 * Get currently authenticated user info from server.
 * Returns an object with {authenticated: boolean, username?: string}
 */
export async function getMe() {
  const res = await api('/api/me');
  return res.ok ? res.json() : { authenticated: false };
}

