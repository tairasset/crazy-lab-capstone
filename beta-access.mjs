import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const cookieName = 'crazy_lab_beta_v2';
const sessionAge = 12 * 60 * 60;
const learning = '/?mission=crazy&mode=learning';
const hash = value => createHash('sha256').update(value).digest();

const accessPage = (message = '') => `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crazy Lab · Private beta</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#18241f;color:#f4eee5;font:16px system-ui}main{box-sizing:border-box;width:min(92vw,430px);padding:28px;border:1px solid #758577;border-radius:14px;background:#24332b}h1{font-size:1.6rem;margin-top:0}p{line-height:1.5}form{display:grid;gap:12px}input,button{font:inherit}input[type=password],button{box-sizing:border-box;width:100%;min-height:42px;border-radius:7px;padding:8px 10px}input[type=password]{border:1px solid #a1ac9c;background:#19251f;color:#fff}button{border:0;background:#edc99a;color:#291c14;font-weight:700;cursor:pointer}strong{display:block;color:#ffd3ac}</style>
<main><h1>Crazy Lab private beta</h1><p>Enter the personal invitation code you received from the organizer.</p>
<p>Pip uses Gemini by default in this beta. Online replies send your question, recent chat and current activity to Google. You can switch to the built-in guide before asking a question.</p>
${message ? `<strong role="alert">${message}</strong>` : ''}
<form method="post" action="/beta/access">
<label for="code">Beta access code</label><input id="code" name="code" type="password" required maxlength="128" autocomplete="current-password">
<button type="submit">Open Learning Mode</button></form></main></html>`;

export function createBetaAccess({ codes, origin, secret }) {
  const invitations = (codes ?? '').split(',').map(code => code.trim()).sort();
  if (invitations.some(code => !/^[A-Za-z0-9_-]{24,128}$/u.test(code))) {
    throw new Error('Set COPPER_LAB_BETA_ACCESS_CODE to one or more comma-separated random codes of 24–128 letters, digits, underscores or hyphens.');
  }
  const validCodes = invitations.map(hash);
  const secure = origin.startsWith('https:') ? '; Secure' : '';
  const signature = value => createHmac('sha256', secret).update(`session:v2:${value}`).digest('base64url');
  const visitorFor = codeHash => createHmac('sha256', secret).update('visitor:').update(codeHash).digest('hex');
  const activeVisitors = new Set(validCodes.map(visitorFor));
  const pageHeaders = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  };

  function session(request) {
    const token = request.headers.cookie?.split(';').map(part => part.trim())
      .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const match = token?.match(/^([0-9a-f]{64})\.(\d{13})\.([A-Za-z0-9_-]{43})$/u);
    if (!match) return null;
    const [, visitor, expires, provided] = match;
    if (!activeVisitors.has(visitor) || Number(expires) <= Date.now() ||
        !timingSafeEqual(Buffer.from(provided), Buffer.from(signature(`${visitor}.${expires}`)))) return null;
    return visitor;
  }

  async function enter(request, response, pathname) {
    if (pathname.startsWith('/api/')) {
      request.resume();
      return response.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ error: 'A private beta invitation is required.' }));
    }
    if (pathname !== '/beta/access' || request.method !== 'POST') {
      request.resume();
      if (request.method === 'GET' || request.method === 'HEAD') return response.writeHead(200, pageHeaders).end(request.method === 'HEAD' ? undefined : accessPage());
      return response.writeHead(405).end();
    }
    if (request.headers.origin !== origin || request.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded') {
      request.resume();
      return response.writeHead(403, pageHeaders).end(accessPage('Open the invitation page and try again.'));
    }
    let size = 0;
    const chunks = [];
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      size += chunk.length;
      if (size > 1024) {
        request.resume();
        return response.writeHead(413).end();
      }
      chunks.push(chunk);
    }
    const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
    const submitted = hash(form.get('code') ?? '');
    if (!validCodes.some(code => timingSafeEqual(submitted, code))) {
      return response.writeHead(403, pageHeaders).end(accessPage('Check your invitation code and try again.'));
    }
    const visitor = visitorFor(submitted);
    const value = `${visitor}.${Date.now() + sessionAge * 1000}`;
    return response.writeHead(303, {
      Location: learning,
      'Cache-Control': 'no-store',
      'Set-Cookie': `${cookieName}=${value}.${signature(value)}; Max-Age=${sessionAge}; Path=/; HttpOnly; SameSite=Strict${secure}`,
    }).end();
  }

  return { session, enter };
}
