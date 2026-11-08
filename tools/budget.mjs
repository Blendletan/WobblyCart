import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MAX_BYTES = 1_500_000;
export const MAX_FILES = 40;

/** Traverse local HTML, CSS, JS, and SVG references; count shared resources once. */
export async function checkBudget(root, entry = 'index.html', limits = {}) {
  root = await realpath(root);
  const pending = [path.resolve(root, entry)];
  const files = new Map();
  const errors = [];
  const within = file => { const relative = path.relative(root, file); return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };
  const add = (ref, from) => {
    if (!ref || ref.startsWith('#')) return;
    if (/^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(ref)) { errors.push(`${path.relative(root, from)}: absolute URL or path ${ref}`); return; }
    let decoded;
    try { decoded = decodeURIComponent(ref.split(/[?#]/)[0]); }
    catch { errors.push(`Invalid resource path: ${ref}`); return; }
    pending.push(path.resolve(path.dirname(from), decoded));
  };
  while (pending.length) {
    const requested = pending.pop();
    if (!within(requested)) { errors.push(`Resource escapes project: ${requested}`); continue; }
    let file;
    try { file = await realpath(requested); }
    catch { errors.push(`Missing resource: ${path.relative(root, requested)}`); continue; }
    if (!within(file)) { errors.push(`Resource escapes project: ${file}`); continue; }
    if (files.has(file)) continue;
    if (!(await stat(file)).isFile()) { errors.push(`Resource is not a file: ${file}`); continue; }
    const bytes = await readFile(file);
    files.set(file, bytes.length);
    const extension = path.extname(file);
    if (!['.html', '.css', '.js', '.mjs', '.svg'].includes(extension)) continue;
    let source = bytes.toString('utf8');
    // SVG's namespace is an identifier, not a loaded resource.
    source = source.replace(/\sxmlns(?::\w+)?=["'][^"']*["']/g, '');
    if (/(?:https?:|wss?:)\/\//i.test(source)) errors.push(`${path.relative(root, file)}: absolute URL`);
    if (['.js', '.mjs', '.html'].includes(extension)) {
      if (/\b(?:fetch|importScripts)\s*\(|\b(?:XMLHttpRequest|WebSocket|EventSource)\b|\.sendBeacon\s*\(/.test(source)) errors.push(`${path.relative(root, file)}: runtime networking`);
      for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        const ref = match[1] ?? match[2];
        if (!ref.startsWith('.')) errors.push(`${path.relative(root, file)}: non-relative module ${ref}`);
        add(ref, file);
      }
      if (/\bimport\s*\(\s*(?![\s"'])/.test(source)) errors.push(`${path.relative(root, file)}: computed import cannot be budgeted`);
    }
    if (['.html', '.svg'].includes(extension)) {
      for (const match of source.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/g)) add(match[1], file);
      for (const match of source.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/g)) {
        for (const candidate of match[1].split(',')) add(candidate.trim().split(/\s+/)[0], file);
      }
    }
    for (const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/g)) add(match[1] ?? match[2], file);
  }
  const bytes = [...files.values()].reduce((sum, size) => sum + size, 0);
  if (bytes > (limits.maxBytes ?? MAX_BYTES)) errors.push(`Byte budget exceeded: ${bytes}`);
  if (files.size > (limits.maxFiles ?? MAX_FILES)) errors.push(`File budget exceeded: ${files.size}`);
  return { bytes, count: files.size, files: [...files.keys()].map(file => path.relative(root, file)), errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = await checkBudget(root, process.argv[2] ?? 'index.html');
  console.log(`${result.count}/${MAX_FILES} files, ${result.bytes.toLocaleString('en-US')}/${MAX_BYTES.toLocaleString('en-US')} bytes uncompressed`);
  if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1; }
  else console.log('Budget and runtime network checks passed.');
}
