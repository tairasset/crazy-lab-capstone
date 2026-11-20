import { createServer } from 'node:http';
import { createHash, createHmac } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGuideApi } from './api-guide.mjs';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const port = Number(process.env.COPPER_LAB_DEMO_PORT ?? process.env.PORT ?? 8791);
// Existing Render services may still use the earlier public launch command.
const publicNeural = process.argv.includes('--public-neural') || process.argv.includes('--public-openai');
const host = process.env.COPPER_LAB_BIND ?? (publicNeural ? '0.0.0.0' : '127.0.0.1');
const localUrl = `http://127.0.0.1:${port}`;
const privateBeta = process.argv.includes('--beta');
const desktop = process.argv.includes('--desktop');
const localOpenAI = process.argv.includes('--local-openai');
const types = new Map([['.html', 'text/html'], ['.css', 'text/css'], ['.js', 'text/javascript'], ['.txt', 'text/plain'], ['.webp', 'image/webp'], ['.mp3', 'audio/mpeg'], ['.glb', 'model/gltf-binary']]);
const insideDist = file => {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

if ([privateBeta, desktop, localOpenAI, publicNeural].filter(Boolean).length > 1) throw new Error('Choose one guide profile.');
if ((desktop || localOpenAI) && host !== '127.0.0.1') throw new Error('The desktop launcher requires a loopback address.');
const geminiApiKey = privateBeta || desktop ? process.env.GEMINI_API_KEY?.trim() || '' : '';
const apiKey = localOpenAI ? process.env.OPENAI_API_KEY?.trim() || '' : '';
let beta;
let origin;
let quota;
let desktopAccess;
let neural;
const destination = process.argv.includes('--open-learning') ? '/?mission=crazy&mode=learning' : '/';

if (publicNeural) {
  const configuredOrigin = process.env.COPPER_LAB_PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL;
  const site = configuredOrigin && URL.canParse(configuredOrigin) ? new URL(configuredOrigin) : null;
  const localPreview = host === '127.0.0.1' && site?.origin === localUrl;
  if (!site || site.href !== `${site.origin}/` || (!localPreview && site.protocol !== 'https:')) {
    throw new Error('Set COPPER_LAB_PUBLIC_ORIGIN or RENDER_EXTERNAL_URL to the HTTPS origin of the public site.');
  }
  origin = site.origin;
  neural = await import('./neural-guide.mjs');
}
if (privateBeta) {
  const site = new URL(process.env.COPPER_LAB_BETA_ORIGIN || localUrl);
  const localPreview = host === '127.0.0.1' && site.origin === localUrl;
  if ((!localPreview && site.protocol !== 'https:') || site.href !== `${site.origin}/`) {
    throw new Error('A hosted beta requires COPPER_LAB_BETA_ORIGIN set to its HTTPS site origin.');
  }
  if (!geminiApiKey) throw new Error('Set GEMINI_API_KEY for the private beta.');
  origin = site.origin;
  const { createBetaAccess } = await import('./beta-access.mjs');
  beta = createBetaAccess({
    codes: process.env.COPPER_LAB_BETA_ACCESS_CODE,
    origin,
    secret: createHmac('sha256', geminiApiKey).update('crazy-lab:beta-session:v1').digest(),
  });
}
if (desktop && geminiApiKey) {
  origin = localUrl;
  const { createDesktopAccess } = await import('./desktop-access.mjs');
  desktopAccess = createDesktopAccess(origin, destination);
}
if (privateBeta || desktopAccess) {
  const { createBetaQuota } = await import('./beta-quota.mjs');
  const dataDir = path.resolve(process.env.COPPER_LAB_BETA_DATA_DIR || fileURLToPath(new URL('./.beta-data/', import.meta.url)));
  if (insideDist(dataDir)) throw new Error('The quota data directory must be outside dist.');
  await mkdir(dataDir, { recursive: true });
  quota = createBetaQuota(path.join(dataDir, 'quota.sqlite'), Number(process.env.COPPER_LAB_BETA_DAILY_LIMIT || 20));
}

const guideApi = createGuideApi({ port, origin, quota, geminiApiKey, apiKey, neural });
const publicApi = desktopAccess ? createGuideApi({ port, origin, geminiApiKey: '', apiKey: '' }) : guideApi;

const server = createServer({ requestTimeout: 15000, headersTimeout: 10000 }, async (request, response) => {
  try {
    const { pathname } = new URL(request.url, localUrl);
    if (desktopAccess && pathname.startsWith('/desktop/start/')) return desktopAccess.enter(request, response, pathname);
    const visitor = (beta ?? desktopAccess)?.session(request);
    if (beta && (!visitor || pathname === '/beta/access')) return await beta.enter(request, response, pathname);
    if (pathname.startsWith('/api/')) {
      if (desktop && pathname === '/api/guide-status') response.setHeader('X-Crazy-Lab-Edition', 'desktop');
      const api = desktopAccess && !visitor ? publicApi : guideApi;
      return await api(request, response, pathname, visitor);
    }
    if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405).end();
    const file = path.resolve(root, `.${decodeURIComponent(pathname === '/' ? '/index.html' : pathname)}`);
    if (!insideDist(file)) return response.writeHead(403).end();
    const type = types.get(path.extname(file));
    if (!type) return response.writeHead(404).end('Not found');
    const body = await readFile(file);
    if (publicNeural) {
      // Keep the downloaded asset across route changes and check its content on each visit.
      const etag = `"${createHash('sha256').update(body).digest('base64url')}"`;
      response.setHeader('ETag', etag);
      response.setHeader('Cache-Control', 'public, no-cache');
      const unchanged = request.headers['if-none-match']?.split(',').some(value => {
        const tag = value.trim();
        return tag === '*' || tag.replace(/^W\//, '') === etag;
      });
      if (unchanged) return response.writeHead(304).end();
    } else response.setHeader('Cache-Control', 'no-store');
    response.writeHead(200, {
      'Content-Type': type.startsWith('text/') ? `${type}; charset=utf-8` : type,
      'Content-Length': body.length,
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

const url = `${origin ?? localUrl}/`;
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') console.error(`The address is already in use. Open ${url}`);
  else console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Copper Lab · ${url}`);
  const shouldOpen = process.argv.includes('--open-learning') || process.argv.includes('--open');
  const openUrl = shouldOpen ? desktopAccess?.launchUrl ?? new URL(destination, url).href : '';
  if (openUrl && process.platform === 'win32') execFile('rundll32.exe', ['url.dll,FileProtocolHandler', openUrl], { windowsHide: true });
});
