import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT ?? 8765);
const mimeTypes = {
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.css': 'text/css; charset=utf-8',
  '.gltf': 'model/gltf+json',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sendError(response, statusCode, message, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  });
  response.end(message);
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendError(response, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    sendError(response, 400, 'Invalid URL');
    return;
  }

  const legacyPages = {
    'Index.html': 'welcome.html',
    'index.html': 'welcome.html',
    index: 'welcome.html',
    'pagina-1.html': 'platform-overview.html',
    'pagina-2.html': 'opportunity-details.html',
    'choose-path.html': 'account-workspaces.html',
    'investment-demo.html': 'investment-checkout.html',
    'my-portfolio.html': 'portfolio.html',
    'user-profile.html': 'profile.html',
    'organization-dashboard.html': 'company-dashboard.html',
    'raise-application.html': 'company-application.html',
    'release-demo.html': 'milestone-releases.html',
  };
  const legacyTarget = legacyPages[pathname.slice(1)];
  if (legacyTarget) {
    response.writeHead(308, {
      Location:
        '/' + legacyTarget.replace(/\.html$/, '') + new URL(request.url, 'http://localhost').search,
    });
    response.end();
    return;
  }

  if (pathname === '/') {
    response.writeHead(308, {
      Location: '/welcome' + new URL(request.url, 'http://localhost').search,
    });
    response.end();
    return;
  }
  if (/^\/[a-zA-Z0-9-]+\.html$/.test(pathname)) {
    response.writeHead(308, {
      Location: pathname.replace(/\.html$/, '') + new URL(request.url, 'http://localhost').search,
    });
    response.end();
    return;
  }
  const resource =
    pathname === '/' ? '/welcome.html' : !extname(pathname) ? pathname + '.html' : pathname;
  const filePath = resolve(root, `.${resource}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    sendError(response, 403, 'Forbidden');
    return;
  }

  let fileStats;
  try {
    fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      sendError(response, 404, 'Not found');
      return;
    }
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      sendError(response, 404, 'Not found');
      return;
    }
    console.error(`Unable to read ${pathname}:`, error);
    sendError(response, 500, 'Unable to read file');
    return;
  }

  const headers = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
  };
  let start = 0;
  let end = fileStats.size - 1;
  let statusCode = 200;
  const rangeHeader = request.headers.range;

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match || (!match[1] && !match[2])) {
      sendError(response, 416, 'Range not satisfiable', {
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes */${fileStats.size}`,
      });
      return;
    }

    if (match[1]) {
      start = Number(match[1]);
      if (match[2]) end = Number(match[2]);
    } else {
      const suffixLength = Number(match[2]);
      start = Math.max(fileStats.size - suffixLength, 0);
    }

    if (start >= fileStats.size || end < start) {
      sendError(response, 416, 'Range not satisfiable', {
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes */${fileStats.size}`,
      });
      return;
    }

    end = Math.min(end, fileStats.size - 1);
    statusCode = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${fileStats.size}`;
  }

  headers['Content-Length'] = end - start + 1;
  response.writeHead(statusCode, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(filePath, { start, end });
  stream.on('error', (error) => {
    console.error(`Unable to stream ${pathname}:`, error);
    if (!response.headersSent) sendError(response, 500, 'Unable to stream file');
    else response.destroy(error);
  });
  stream.pipe(response);
});

console.log('Raftt local server starting');
server.listen(port, '127.0.0.1', () => {
  console.log(`Raftt local server ready at http://127.0.0.1:${port}/welcome`);
});

server.on('error', (error) => {
  console.error(`${fileURLToPath(import.meta.url)}:1: Raftt local server failed: ${error.message}`);
  process.exitCode = 1;
});
