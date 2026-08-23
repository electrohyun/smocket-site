import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ version: 'production' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const path = join(process.cwd(), 'app', 'preview', 'drawing-game', 'game', 'game-handler.ts');
  const source = await readFile(path);
  const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
  return Response.json({ version }, { headers: { 'Cache-Control': 'no-store' } });
}
