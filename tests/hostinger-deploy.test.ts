import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const script = path.resolve('scripts/hostinger-publish.sh');
const release = `123-1-${'a'.repeat(40)}`;
const directories: string[] = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'eclipse-hostinger-test-'));
  directories.push(root);
  const domain = path.join(root, 'domains/eclipse-business.com');
  const target = path.join(domain, 'public_html');
  const base = path.join(domain, '.eclipse-deploy');
  const stage = path.join(base, 'staging', release);
  const put = (name: string, content: string) => {
    mkdirSync(path.dirname(name), { recursive: true });
    writeFileSync(name, content);
  };
  put(path.join(target, 'default.php'), 'original welcome');
  put(path.join(target, '.well-known/keep.txt'), 'unrelated');
  put(path.join(target, '_next/static/old.js'), 'old asset');
  for (const file of ['index.html', '404.html', 'es/index.html', 'es/portal/index.html', '_next/static/new.js']) {
    put(path.join(stage, file), 'new static file');
  }
  put(path.join(stage, '.htaccess'), readFileSync('deploy/hostinger.htaccess', 'utf8'));
  const run = (action = 'publish', env: NodeJS.ProcessEnv = process.env) =>
    spawnSync('bash', [script, action, target, release], { encoding: 'utf8', env });
  return { root, target, base, stage, put, run };
}

describe('Hostinger publication and recovery', () => {
  it('backs up hidden files, preserves unrelated files and old assets, and rolls back new files', () => {
    const f = fixture();
    const result = f.run();
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(path.join(f.base, 'backups', `${release}.tar.gz`))).toBe(true);
    expect(readFileSync(path.join(f.target, '.well-known/keep.txt'), 'utf8')).toBe('unrelated');
    expect(readFileSync(path.join(f.target, '_next/static/old.js'), 'utf8')).toBe('old asset');
    expect(existsSync(path.join(f.target, 'es/portal/index.html'))).toBe(true);
    const rollback = f.run('rollback');
    expect(rollback.status, rollback.stderr).toBe(0);
    expect(existsSync(path.join(f.target, 'index.html'))).toBe(false);
    expect(existsSync(path.join(f.target, '.htaccess'))).toBe(false);
    expect(existsSync(path.join(f.target, '_next/static/new.js'))).toBe(false);
    expect(readFileSync(path.join(f.target, 'default.php'), 'utf8')).toBe('original welcome');
  });

  it('restores an existing managed page and htaccess', () => {
    const f = fixture();
    f.put(path.join(f.target, 'index.html'), 'previous home');
    const previous = '# Eclipse Hostinger managed static export\n# previous rules\n';
    f.put(path.join(f.target, '.htaccess'), previous);
    expect(f.run().status).toBe(0);
    expect(f.run('rollback').status).toBe(0);
    expect(readFileSync(path.join(f.target, 'index.html'), 'utf8')).toBe('previous home');
    expect(readFileSync(path.join(f.target, '.htaccess'), 'utf8')).toBe(previous);
  });

  it('leaves an unreviewed htaccess unchanged', () => {
    const f = fixture();
    f.put(path.join(f.target, '.htaccess'), '# existing hosting rules');
    expect(f.run().status).not.toBe(0);
    expect(readFileSync(path.join(f.target, '.htaccess'), 'utf8')).toBe('# existing hosting rules');
    expect(existsSync(path.join(f.target, 'index.html'))).toBe(false);
  });

  it('does not publish while another deployment holds the lock', () => {
    const f = fixture();
    mkdirSync(path.join(f.base, 'lock'));
    expect(f.run().status).not.toBe(0);
    expect(existsSync(path.join(f.target, 'index.html'))).toBe(false);
    expect(existsSync(path.join(f.base, 'lock'))).toBe(true);
  });

  it('automatically restores the backup after copying assets fails', () => {
    const f = fixture();
    const bin = path.join(f.root, 'bin');
    mkdirSync(bin);
    const cp = path.join(bin, 'cp');
    f.put(cp, '#!/usr/bin/env bash\n/bin/cp "$@"\nexit 1\n');
    chmodSync(cp, 0o755);
    const result = f.run('publish', { ...process.env, PATH: `${bin}:${process.env.PATH}` });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('Restored backup');
    expect(existsSync(path.join(f.target, '_next/static/new.js'))).toBe(false);
    expect(readFileSync(path.join(f.target, 'default.php'), 'utf8')).toBe('original welcome');
    expect(existsSync(path.join(f.base, 'lock'))).toBe(false);
  });
});
