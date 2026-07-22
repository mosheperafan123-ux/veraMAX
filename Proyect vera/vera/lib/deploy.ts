import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execAsync = promisify(exec);

/**
 * Publica los demos en GitHub Pages (gratis, permanente, reconocido).
 * Empuja la carpeta public/demos a un repo dedicado; Pages la sirve en
 *   {DEMOS_PUBLIC_BASE}/{leadId}/
 *
 * Configuración una sola vez (ver README):
 *   GITHUB_TOKEN       → Personal Access Token con permiso de "Contents: write"
 *   GITHUB_REPO        → "usuario/vera-demos"
 *   DEMOS_PUBLIC_BASE  → https://usuario.github.io/vera-demos
 *   GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL (opcional)
 */

const DEMOS_DIR = path.join(process.cwd(), 'public', 'demos');
const DEPLOY_DIR = path.join(process.cwd(), '.deploy-demos'); // working tree del repo de Pages (gitignored)

export interface PublishResult {
  ok: boolean;
  configured: boolean;
  baseUrl?: string;
  live?: boolean;
  error?: string;
}

export function isDeployConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO && process.env.DEMOS_PUBLIC_BASE);
}

export function publicDemoUrl(leadId: number): string | null {
  const base = process.env.DEMOS_PUBLIC_BASE;
  return base ? `${base.replace(/\/$/, '')}/${leadId}/` : null;
}

/** Espera (poll) a que una URL responda 200, hasta timeoutMs. */
async function waitForUrl(url: string, timeoutMs = 90000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) return true;
    } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 4000));
  }
  return false;
}

async function git(args: string, cwd: string): Promise<string> {
  const { stdout } = await execAsync(`git ${args}`, { cwd, env: process.env, maxBuffer: 20 * 1024 * 1024, windowsHide: true });
  return stdout;
}

export async function publishDemos(leadIdToVerify?: number): Promise<PublishResult> {
  if (!isDeployConfigured()) {
    return { ok: false, configured: false, error: 'Hosting no configurado. Define GITHUB_TOKEN, GITHUB_REPO y DEMOS_PUBLIC_BASE en .env.local (ver README).' };
  }

  const token = process.env.GITHUB_TOKEN!;
  const repo = process.env.GITHUB_REPO!; // usuario/repo
  const base = process.env.DEMOS_PUBLIC_BASE!.replace(/\/$/, '');
  const name = process.env.GIT_AUTHOR_NAME || 'Vera Bot';
  const email = process.env.GIT_AUTHOR_EMAIL || 'vera@local';
  const pushUrl = `https://x-access-token:${token}@github.com/${repo}.git`;

  try {
    // 1) Preparar el working tree del repo de Pages.
    fs.mkdirSync(DEPLOY_DIR, { recursive: true });
    if (!fs.existsSync(path.join(DEPLOY_DIR, '.git'))) {
      await git('init', DEPLOY_DIR);
      await git('branch -M main', DEPLOY_DIR);
    }
    await git(`config user.name "${name}"`, DEPLOY_DIR);
    await git(`config user.email "${email}"`, DEPLOY_DIR);

    // 2) Sincronizar los demos (limpiamos los {id}/ previos y copiamos los actuales).
    for (const entry of fs.readdirSync(DEPLOY_DIR)) {
      if (entry === '.git') continue;
      fs.rmSync(path.join(DEPLOY_DIR, entry), { recursive: true, force: true });
    }
    if (fs.existsSync(DEMOS_DIR)) {
      fs.cpSync(DEMOS_DIR, DEPLOY_DIR, { recursive: true });
    }
    // .nojekyll: que Pages sirva los archivos tal cual (sin procesado Jekyll).
    fs.writeFileSync(path.join(DEPLOY_DIR, '.nojekyll'), '');
    // index de cortesía en la raíz.
    fs.writeFileSync(path.join(DEPLOY_DIR, 'index.html'), '<!doctype html><meta charset="utf-8"><title>Vera demos</title><p>Demos de Vera.</p>');

    // 3) Commit + push (force: el repo de demos es regenerable).
    await git('add -A', DEPLOY_DIR);
    try {
      await git(`commit -m "publicar demos"`, DEPLOY_DIR);
    } catch { /* "nothing to commit" → seguimos */ }
    await git(`push --force ${pushUrl} main`, DEPLOY_DIR);

    // 4) Esperar a que el demo esté en vivo (GitHub Pages tarda en la 1ª build).
    const verifyUrl = leadIdToVerify != null ? `${base}/${leadIdToVerify}/` : base + '/';
    const live = await waitForUrl(verifyUrl, 90000);

    return { ok: true, configured: true, baseUrl: base, live };
  } catch (e) {
    return { ok: false, configured: true, error: (e as Error).message.slice(0, 500) };
  }
}
