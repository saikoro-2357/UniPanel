const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const port = Number(process.env.PORT) || 4173;
const indexPath = path.join(__dirname, 'index.html');

function normalizeCode(value) {
  return /^[0-9A-F]{4}$/i.test(value ?? '') ? value.toUpperCase() : '0041';
}

function normalizeBackground(value) {
  return /^[0-9A-F]{6}$/i.test(value ?? '') ? value.toUpperCase() : '000000';
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function displayCodePoint(value) {
  if (value < 0x20) return 0x2400 + value;
  if (value === 0x7F) return 0x2421;
  if ((value >= 0x80 && value <= 0x9F)
    || (value >= 0xD800 && value <= 0xDFFF)
    || (value >= 0xFDD0 && value <= 0xFDEF)
    || value >= 0xFFFE) return 0x0378;
  return value;
}

function createOgSvg(code, background) {
  const value = Number.parseInt(code, 16);
  const glyph = displayCodePoint(value);
  const cells = [];
  for (let col = 0; col < 4; col += 1) {
    const digit = Number.parseInt(code[col], 16);
    for (let row = 0; row < 4; row += 1) {
      if (digit & (8 >> row)) {
        cells.push(`<rect x="${100 + col * 90}" y="${110 + row * 90}" width="90" height="90" fill="url(#hatch)"/>`);
      }
    }
  }

  const gridLines = [];
  for (let index = 0; index <= 4; index += 1) {
    const offset = index * 90;
    gridLines.push(`<path d="M ${100 + offset} 110 V 470 M 100 ${110 + offset} H 460"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="16" stroke="#F5F5F2" stroke-width="4"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#${background}"/>
  <text x="72" y="68" fill="#F5F5F2" font-family="monospace" font-size="34" font-weight="600" letter-spacing="3">UniPanel</text>
  ${cells.join('')}
  <g fill="none" stroke="#F5F5F2" stroke-width="3">${gridLines.join('')}</g>
  <text x="84" y="535" fill="#888888" font-family="monospace" font-size="34">U+</text>
  <text x="140" y="535" fill="#F5F5F2" font-family="monospace" font-size="56" letter-spacing="40">${code}</text>
  <line x1="565" y1="110" x2="565" y2="470" stroke="#F5F5F2" stroke-opacity=".2"/>
  <text x="850" y="390" fill="#F5F5F2" font-family="Noto Sans,Noto Sans CJK JP,sans-serif" font-size="290" text-anchor="middle">&#x${glyph.toString(16)};</text>
</svg>`;
}

function injectOpenGraph(html, requestUrl, code, background) {
  const imageUrl = new URL('/og.png', requestUrl);
  imageUrl.searchParams.set('code', code);
  imageUrl.searchParams.set('bg', background);
  const title = `UniPanel — U+${code}`;
  const description = '4×4パネルでつくったUnicode文字を共有します。';
  const meta = `
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="UniPanel">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeAttribute(requestUrl.href)}">
  <meta property="og:image" content="${escapeAttribute(imageUrl.href)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeAttribute(imageUrl.href)}">`;
  return html.replace('</head>', `${meta}\n</head>`);
}

const server = http.createServer(async (request, response) => {
  const protocol = String(request.headers['x-forwarded-proto'] ?? 'http').split(',')[0].trim();
  const host = request.headers.host ?? `127.0.0.1:${port}`;
  const requestUrl = new URL(request.url, `${protocol}://${host}`);
  const code = normalizeCode(requestUrl.searchParams.get('code'));
  const background = normalizeBackground(requestUrl.searchParams.get('bg'));

  try {
    if (requestUrl.pathname === '/og.png') {
      const png = await sharp(Buffer.from(createOgSvg(code, background))).png().toBuffer();
      response.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': png.length,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      response.end(png);
      return;
    }

    if (requestUrl.pathname === '/' || requestUrl.pathname === '/share') {
      let html = fs.readFileSync(indexPath, 'utf8');
      if (requestUrl.pathname === '/share') {
        html = injectOpenGraph(html, requestUrl, code, background);
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': requestUrl.pathname === '/share' ? 'public, max-age=300' : 'no-cache'
      });
      response.end(html);
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`UniPanel: http://127.0.0.1:${port}`);
});

