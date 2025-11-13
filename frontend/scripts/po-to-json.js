const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/locales');
const outFile = path.join(localesDir, 'en', 'translation.json');

function readPo(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const msgs = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('msgid')) {
      // msgid "..."
      let m = line.match(/^msgid\s+"(.*)"$/);
      if (m) {
        msgs.push(m[1]);
      } else if (line === 'msgid ""') {
        // multi-line msgid, collect following lines until msgstr
        let full = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('msgstr')) {
          const l = lines[i].trim();
          const mm = l.match(/^"(.*)"$/);
          if (mm) full += mm[1];
          i++;
        }
        msgs.push(full);
        i--;
      }
    }
  }
  return msgs.filter(s => s && s.length > 0);
}

function safeKeyFromText(text) {
  let t = text.replace(/<[^>]+>/g, ' '); // remove HTML tags
  t = t.replace(/[^a-zA-Z0-9\s]/g, ' ');
  t = t.trim().toLowerCase().replace(/\s+/g, '_');
  if (t.length === 0) t = 'key';
  if (t.length > 60) t = t.slice(0, 60);
  return t;
}

function main() {
  const localeDirs = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());
  const allMsgids = new Set();
  localeDirs.forEach(dir => {
    const poFile = path.join(localesDir, dir, 'messages.po');
    if (fs.existsSync(poFile)) {
      const msgs = readPo(poFile);
      msgs.forEach(m => allMsgids.add(m));
    }
  });

  const existing = {};
  if (fs.existsSync(outFile)) {
    try {
      Object.assign(existing, JSON.parse(fs.readFileSync(outFile, 'utf8')));
    } catch (e) {}
  }

  const usedKeys = new Set(Object.keys(existing));
  const map = Object.assign({}, existing);

  Array.from(allMsgids).forEach(msg => {
    // Skip empty
    if (!msg || msg.trim().length === 0) return;
    // If message already present as value, keep its key
    const presentKey = Object.keys(map).find(k => map[k] === msg);
    if (presentKey) return;
    let base = safeKeyFromText(msg);
    let key = base;
    let suffix = 1;
    while (usedKeys.has(key)) {
      key = `${base}_${suffix}`;
      suffix++;
    }
    usedKeys.add(key);
    map[key] = msg;
  });

  // Sort keys for readability
  const ordered = {};
  Object.keys(map).sort().forEach(k => ordered[k] = map[k]);

  fs.writeFileSync(outFile, JSON.stringify(ordered, null, 2), 'utf8');
  console.log('Wrote', outFile, 'with', Object.keys(ordered).length, 'keys');
}

main();
