import { randomBytes, timingSafeEqual } from 'node:crypto';

const nonce = () => randomBytes(32).toString('base64url');
const cookieName = 'crazy_lab_desktop';
const sessionSeconds = 12 * 60 * 60;
const matches = (candidate, secret) => {
  if (!secret || typeof candidate !== 'string' || candidate.length !== secret.length) return false;
  const value = Buffer.from(candidate);
  const expected = Buffer.from(secret);
  return value.length === expected.length && timingSafeEqual(value, expected);
};

export function createDesktopAccess(origin, destination) {
  const host = new URL(origin).host;
  let ticket = nonce();
  const ticketExpires = Date.now() + 2 * 60 * 1000;
  let cookie, cookieExpires = 0;
  const launchUrl = origin + '/desktop/start/' + ticket;

  function enter(request, response, pathname) {
    const token = pathname.slice('/desktop/start/'.length);
    const allowed = request.method === 'GET' && request.headers.host === host &&
      (!request.headers.origin || request.headers.origin === origin) &&
      request.headers['sec-fetch-site'] !== 'cross-site';
    const headers = { Location: destination, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
    if (allowed && Date.now() < ticketExpires && matches(token, ticket)) {
      ticket = undefined;
      cookie = nonce();
      cookieExpires = Date.now() + sessionSeconds * 1000;
      headers['Set-Cookie'] = `${cookieName}=${cookie}; Max-Age=${sessionSeconds}; Path=/api/; HttpOnly; SameSite=Strict`;
    }
    request.resume();
    response.writeHead(303, headers).end();
  }

  function session(request) {
    if (request.headers.host !== host || Date.now() >= cookieExpires) return;
    const token = request.headers.cookie?.split(';').map(part => part.trim())
      .find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    if (matches(token, cookie)) return 'local-desktop';
  }
  return { launchUrl, enter, session };
}
