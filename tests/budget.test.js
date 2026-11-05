import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkBudget } from '../tools/budget.mjs';

async function fixture(t, files) {
  const root = await mkdtemp(path.join(tmpdir(), 'wobbly-budget-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), content);
  }
  return root;
}

test('budget follows transitive modules and CSS assets, counting shared resources once', async t => {
  const files = {
    'index.html': '<link href="./style.css"><script type="module" src="./main.js"></script>',
    'main.js': 'import { x } from "./shared.js"; import("./lazy.js");',
    'shared.js': 'export const x = 1;',
    'lazy.js': 'export { x } from "./shared.js";',
    'style.css': 'body { background: url("./tile.svg"); }',
    'tile.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  };
  const root = await fixture(t, files);
  const result = await checkBudget(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.count, 6);
  assert.equal(result.bytes, Object.values(files).reduce((n, s) => n + Buffer.byteLength(s), 0));
  assert.ok((await checkBudget(root, 'index.html', { maxFiles: 5 })).errors.some(e => e.includes('File budget')));
  assert.ok((await checkBudget(root, 'index.html', { maxBytes: 1 })).errors.some(e => e.includes('Byte budget')));
});

test('budget rejects external URLs, remote imports, runtime requests, missing files, and root escapes', async t => {
  for (const source of [
    'import "https://example.com/module.js";',
    'fetch("./data.json");',
    'new WebSocket("wss://example.com");',
    'import "../outside.js";',
    'import "./missing.js";',
    'import(dynamicPath);',
  ]) {
    const root = await fixture(t, { 'index.html': '<script type="module" src="./main.js"></script>', 'main.js': source });
    assert.ok((await checkBudget(root)).errors.length > 0, source);
  }
});

test('simulation does not depend on browser APIs or presentation modules', async () => {
  const folder = new URL('../src/sim/', import.meta.url);
  for (const file of await readdir(folder)) {
    if (!file.endsWith('.js')) continue;
    const source = await readFile(new URL(file, folder), 'utf8');
    assert.doesNotMatch(source, /\b(?:document|window|localStorage)\b|Date\.now|Math\.random/);
    assert.doesNotMatch(source, /from\s+['"][^'"]*(?:render|audio|meta|platform)\//);
  }
});
