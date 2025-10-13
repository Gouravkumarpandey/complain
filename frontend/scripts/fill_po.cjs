const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node fill_po.cjs <path-to-messages.po>');
  process.exit(1);
}

const poPath = path.resolve(process.argv[2]);
let content = fs.readFileSync(poPath, 'utf8');

const lines = content.split(/\r?\n/);
let out = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);
  if (line.startsWith('msgid "') && line !== 'msgid ""') {
    if (i + 1 < lines.length && lines[i + 1].startsWith('msgstr')) {
      const next = lines[i + 1];
      if (next.trim() === 'msgstr ""') {
        const match = line.match(/^msgid "(.*)"$/);
        const msgid = match ? match[1] : '';
        const escaped = msgid.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        out.push(`msgstr "${escaped}"`);
        i += 1; // skip the original msgstr line
      }
    }
  }
}

const newContent = out.join('\n');
fs.writeFileSync(poPath, newContent, 'utf8');
console.log('Updated', poPath);
