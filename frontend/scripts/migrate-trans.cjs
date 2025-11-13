const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');
const localesFile = path.join(srcDir, 'locales', 'en', 'translation.json');

function buildValueToKeyMap() {
  const map = {};
  const json = JSON.parse(fs.readFileSync(localesFile, 'utf8'));
  Object.keys(json).forEach(k => {
    map[json[k]] = k;
  });
  return map;
}

function walk(dir) {
  const files = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (/\.(tsx|ts|jsx|js)$/.test(f)) files.push(full);
  });
  return files;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;
  // place after first import block
  const match = content.match(/(^import[\s\S]*? from .+;\s*)/m);
  if (match) {
    return content.replace(match[0], match[0] + importLine + '\n');
  }
  return importLine + '\n' + content;
}

function relativeImportPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, path.join(srcDir, 'i18n.ts'));
  rel = rel.replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  // remove .ts extension for import
  rel = rel.replace(/\.ts$/, '');
  return rel;
}

function migrateFile(file, map) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  // Replace <Trans>...</Trans>
  const transRegex = /<Trans>([\s\S]*?)<\\?\/Trans>/g;
  content = content.replace(/<Trans>([\s\S]*?)<\\?\/Trans>/g, (m, inner) => {
    const text = inner.replace(/\s+/g, ' ').trim();
    if (map[text]) {
      return `{i18n.t('${map[text]}')}`;
    }
    return m;
  });

  // Replace template-tag t`...`
  const tTagRegex = /t`([\s\S]*?)`/g;
  content = content.replace(tTagRegex, (m, inner) => {
    const text = inner.replace(/\s+/g, ' ').trim();
    if (map[text]) {
      return `i18n.t('${map[text]}')`;
    }
    return m;
  });

  // Remove imports from i18n-compat
  if (content.includes("from '../../i18n-compat'") || content.includes("from '../i18n-compat'") || content.includes("from './i18n-compat'")) {
    content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]\.{1,2}\/i18n-compat['"];?\s*/g, '');
  }

  // If we performed replacements, ensure i18n import exists for this file
  if (content !== orig) {
    const rel = relativeImportPath(file);
    const importLine = `import { i18n } from '${rel}';`;
    content = ensureImport(content, importLine);
    fs.writeFileSync(file, content, 'utf8');
    return true;
  }
  return false;
}

function main() {
  const map = buildValueToKeyMap();
  const files = walk(srcDir);
  let changed = 0;
  files.forEach(f => {
    try {
      if (migrateFile(f, map)) changed++;
    } catch (e) {
      console.error('Failed to process', f, e.message);
    }
  });
  console.log('Processed', files.length, 'files, changed', changed);
}

main();
