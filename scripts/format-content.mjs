// Re-formats /content/*.json the way they are written by hand: 2-space indent, and
// short localized objects ({ "es", "en", "pt" }) kept on one line when they fit.
// Usage: node scripts/format-content.mjs content/verticals.json [...]
import { readFileSync, writeFileSync } from 'node:fs';

const MAX = 100;
const LOCALIZED = /^( *)("[^"]+": )?\{\n +"es": ("(?:[^"\\]|\\.)*"),\n +"en": ("(?:[^"\\]|\\.)*"),\n +"pt": ("(?:[^"\\]|\\.)*")\n +\}(,?)$/gm;

for (const file of process.argv.slice(2)) {
  const pretty = JSON.stringify(JSON.parse(readFileSync(file, 'utf8')), null, 2);
  const out = pretty.replace(LOCALIZED, (whole, indent, key = '', es, en, pt, comma) => {
    const line = `${indent}${key}{ "es": ${es}, "en": ${en}, "pt": ${pt} }${comma}`;
    return line.length <= MAX ? line : whole;
  });
  writeFileSync(file, out + '\n');
  console.log('formatted', file);
}
