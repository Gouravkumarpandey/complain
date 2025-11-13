const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node fill_po.js <path-to-messages.po>');
  process.exit(1);
}

const poPath = path.resolve(process.argv[2]);
let content = fs.readFileSync(poPath, 'utf8');

// Preserve header (first msgid "" block). We'll only replace msgstr "" that follow a non-empty msgid.
// This simple parser looks for lines: msgid "..."\nmsgstr "" and replaces the msgstr with the same content as msgid.

const lines = content.split(/\r?\n/);
let out = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);
  if (line.startsWith('msgid "') && line !== 'msgid ""') {
    // look ahead for msgstr ""
    if (i + 1 < lines.length && lines[i + 1].startsWith('msgstr')) {
      const next = lines[i + 1];
      if (next.trim() === 'msgstr ""') {
        // extract msgid content
        const match = line.match(/^msgid "(.*)"$/);
        const msgid = match ? match[1] : '';
        // escape any double quotes and backslashes in msgid
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
