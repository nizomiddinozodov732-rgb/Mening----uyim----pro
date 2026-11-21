import { NextResponse, type NextRequest } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Dizayn maketlari repo ildizidagi `design/` papkasida joylashgan.
// Bu route handler ularni Next.js serveri orqali xizmat qiladi, shu sababli
// brauzerda http://localhost:3000/design/mockups/home.html ko'rinishida ochiladi.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DESIGN_ROOT = path.resolve(process.cwd(), '..', 'design');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await params;

  // /design → maketlar bosh sahifasi
  if (!segments || segments.length === 0) {
    return NextResponse.redirect(new URL('/design/mockups/index.html', req.url));
  }

  const target = path.resolve(DESIGN_ROOT, ...segments);

  // Path traversal himoyasi — DESIGN_ROOT tashqarisiga chiqishni bloklaydi
  if (target !== DESIGN_ROOT && !target.startsWith(DESIGN_ROOT + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const info = await stat(target);
    const file = info.isDirectory() ? path.join(target, 'index.html') : target;
    const body = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
