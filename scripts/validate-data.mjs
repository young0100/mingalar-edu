import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const read = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const isUrl = (value) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch { return false; } };
export function provenanceWarnings(value, path = 'data') {
  const warnings = [];
  if (!value || typeof value !== 'object') return warnings;
  if ('value' in value || 'stage1' in value || 'usd_mmk' in value) {
    if (!isUrl(value.source)) warnings.push(`${path}: missing source URL`);
    if (!value.asof || value.asof === 'TODO' || !/^\d{4}-\d{2}-\d{2}$/.test(value.asof)) warnings.push(`${path}: missing asof date`);
  }
  for (const [key, child] of Object.entries(value)) warnings.push(...provenanceWarnings(child, `${path}.${key}`));
  return warnings;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const name of ['site', 'schools', 'products', 'fees']) {
    for (const warning of provenanceWarnings(read(name), name)) console.warn(`[data warning] ${warning}`);
  }
}
