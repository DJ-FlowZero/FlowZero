const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json({ limit: '5mb' }));

const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_PATH = path.join(PUBLIC_DIR, 'config.json');
let FZ_GPATH = '.\\Gestalt';
try {
  const configRaw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const config = JSON.parse(configRaw);
  if (config.FZ_GPATH) FZ_GPATH = config.FZ_GPATH;
} catch (e) {
  console.warn('[Config] Could not load FZ_GPATH from config.json, using default:', e);
}
const GESTALT_DIR = path.join(PUBLIC_DIR, FZ_GPATH);
const FILENAME = 'text_text.txt';

// Resolves a client-supplied filename safely within a base directory.
// Returns the resolved absolute path, or null if it would escape the base.
function safeFilePath(base, filename) {
  if (!filename || typeof filename !== 'string') return null;
  // Reject filenames with directory separators to prevent traversal
  if (/[\\/]/.test(filename)) return null;
  const resolved = path.resolve(base, filename);
  const baseFull = path.resolve(base);
  if (!resolved.startsWith(baseFull + path.sep) && resolved !== baseFull) return null;
  return resolved;
}


// Endpoint to save (stage) a profile JSON file to NewState with backup
app.post('/api/save-profile', (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename) return res.status(400).json({ status: 'error', message: 'Missing filename.' });
    const profilePath = safeFilePath(GESTALT_DIR, filename);
    if (!profilePath) return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
    const backupDir = path.join(GESTALT_DIR, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    if (fs.existsSync(profilePath)) {
      const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      fs.copyFileSync(profilePath, path.join(backupDir, `${filename}.bck.${ts}`));
      const all = fs.readdirSync(backupDir).filter(f => f.startsWith(filename + '.bck.')).sort();
      if (all.length > 10) all.slice(0, all.length - 10).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
    }
    fs.writeFileSync(profilePath, content || '', 'utf8');
    const backups = getBackupList(backupDir, filename);
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    res.json({ status: 'ok', message: `Saved at ${ts}`, backups });
  } catch (err) {
    console.error('[Profile Save] Write error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save profile.' });
  }
});

// GET /api/profile/backups?filename=fz0000.json
app.get('/api/profile/backups', (req, res) => {
  const { filename } = req.query;
  if (!filename || /[\\/]/.test(filename))
    return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
  const backupDir = path.join(GESTALT_DIR, 'backups');
  res.json({ status: 'ok', backups: getBackupList(backupDir, filename) });
});

// GET /api/profile/restore?filename=fz0000.json&file=fz0000.json.bck.2026-05-01T12-00-00
app.get('/api/profile/restore', (req, res) => {
  const { filename, file } = req.query;
  if (!filename || !file || /[\\/]/.test(filename) || /[\\/]/.test(file))
    return res.status(400).json({ status: 'error', message: 'Invalid parameters.' });
  const backupDir = path.join(GESTALT_DIR, 'backups');
  const backupPath = path.join(backupDir, file);
  if (!path.resolve(backupPath).startsWith(path.resolve(backupDir) + path.sep))
    return res.status(400).json({ status: 'error', message: 'Invalid backup path.' });
  if (!fs.existsSync(backupPath)) return res.status(404).json({ status: 'error', message: 'Backup not found.' });
  res.json({ status: 'ok', content: fs.readFileSync(backupPath, 'utf8') });
});

// Endpoint to refresh (publish) a profile file — confirms it exists in Gestalt dir
app.post('/api/refresh-profile', (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ status: 'error', message: 'Missing filename.' });
    }
    const dest = safeFilePath(GESTALT_DIR, filename);
    if (!dest) {
      return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
    }
    const backupPath = dest + '.bck';
    const src = dest; // file is already in GESTALT_DIR after save-profile
    if (!fs.existsSync(src)) {
      return res.status(404).json({ status: 'error', message: 'No staged profile found.' });
    }
    // Backup the current public profile before overwrite
    if (fs.existsSync(dest)) {
      try {
        fs.copyFileSync(dest, backupPath);
        console.log('[Profile Refresh] Backup created/updated:', backupPath);
      } catch (err) {
        console.error('[Profile Refresh] Backup failed:', err);
      }
    }
    fs.copyFileSync(src, dest);
    res.json({ status: 'ok', message: 'Profile refreshed to public (backup created if previous version existed).' });
  } catch (err) {
    console.error('[Profile Refresh] Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to refresh profile.' });
  }
});


// Endpoint to save a text file in Gestalt dir with backup
app.post('/api/save-text', (req, res) => {
  const file = req.body.filename || FILENAME;
  const content = req.body.content || "";
  const filePath = safeFilePath(GESTALT_DIR, file);
  if (!filePath) {
    return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
  }
  const backupPath = filePath + '.bck';
  if (fs.existsSync(filePath)) {
    try { fs.copyFileSync(filePath, backupPath); } catch {}
  }
  fs.writeFileSync(filePath, content, 'utf8');
  res.json({ status: 'ok' });
});

// ─── TXT editor: load / save / restore with timestamped backups ───────────
// fetchPath format: "fz_txt/FZ_99.txt"  or  "Gestalt/fz_text_3working.txt"
// Backups land in a backups/ subfolder next to the source file.
function resolveTxtPath(fetchPath) {
  if (!fetchPath || typeof fetchPath !== 'string') return null;
  const sep = fetchPath.indexOf('/');
  if (sep < 0) return null;
  const dirSegment = fetchPath.slice(0, sep);
  const filename   = fetchPath.slice(sep + 1);
  if (/[\\/]/.test(filename)) return null;           // no traversal in filename
  let baseDir;
  if      (dirSegment === 'fz_txt')  baseDir = path.join(PUBLIC_DIR, 'fz_txt');
  else if (dirSegment === 'Gestalt') baseDir = GESTALT_DIR;
  else if (dirSegment === 'fz_md')   baseDir = path.join(PUBLIC_DIR, 'fz_md');
  else return null;
  const filePath  = path.resolve(baseDir, filename);
  const backupDir = path.join(baseDir, 'backups');
  if (!filePath.startsWith(path.resolve(baseDir) + path.sep)) return null;
  return { filePath, filename, backupDir };
}

function getBackupList(backupDir, filename) {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith(filename + '.bck.'))
    .sort().reverse().slice(0, 10);
}

// GET /api/txt/load?fetchPath=fz_txt/FZ_99_DailyBlog.txt
app.get('/api/txt/load', (req, res) => {
  const r = resolveTxtPath(req.query.fetchPath);
  if (!r) return res.status(400).json({ status: 'error', message: 'Invalid path.' });
  if (!fs.existsSync(r.filePath)) return res.status(404).json({ status: 'error', message: 'File not found.' });
  const content = fs.readFileSync(r.filePath, 'utf8');
  const backups = getBackupList(r.backupDir, r.filename);
  res.json({ status: 'ok', content, backups });
});

// POST /api/txt/save  { fetchPath, content }
app.post('/api/txt/save', (req, res) => {
  try {
    const { fetchPath, content } = req.body;
    if (!fetchPath || content === undefined)
      return res.status(400).json({ status: 'error', message: 'Missing fetchPath or content.' });
    const r = resolveTxtPath(fetchPath);
    if (!r) return res.status(400).json({ status: 'error', message: 'Invalid path.' });
    if (!fs.existsSync(r.backupDir)) fs.mkdirSync(r.backupDir, { recursive: true });
    if (fs.existsSync(r.filePath)) {
      const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      fs.copyFileSync(r.filePath, path.join(r.backupDir, `${r.filename}.bck.${ts}`));
      // Prune — keep last 10 per file
      const all = fs.readdirSync(r.backupDir).filter(f => f.startsWith(r.filename + '.bck.')).sort();
      if (all.length > 10) all.slice(0, all.length - 10).forEach(f => fs.unlinkSync(path.join(r.backupDir, f)));
    }
    fs.writeFileSync(r.filePath, content, 'utf8');
    const backups = getBackupList(r.backupDir, r.filename);
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    res.json({ status: 'ok', message: `Saved at ${ts}`, backups });
  } catch (err) {
    console.error('[Txt Save] Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save.' });
  }
});

// GET /api/txt/restore?fetchPath=fz_txt/FZ_99.txt&file=FZ_99.txt.bck.2026-05-01T14-30-00
app.get('/api/txt/restore', (req, res) => {
  const r = resolveTxtPath(req.query.fetchPath);
  if (!r) return res.status(400).json({ status: 'error', message: 'Invalid path.' });
  const backupFile = req.query.file;
  if (!backupFile || /[\\/]/.test(backupFile))
    return res.status(400).json({ status: 'error', message: 'Invalid backup filename.' });
  const backupPath = path.join(r.backupDir, backupFile);
  if (!path.resolve(backupPath).startsWith(path.resolve(r.backupDir) + path.sep))
    return res.status(400).json({ status: 'error', message: 'Invalid backup path.' });
  if (!fs.existsSync(backupPath)) return res.status(404).json({ status: 'error', message: 'Backup not found.' });
  res.json({ status: 'ok', content: fs.readFileSync(backupPath, 'utf8') });
});
// ──────────────────────────────────────────────────────────────────────────

// Endpoint to list .txt files available for editing (from Gestalt and fz_txt dirs)
app.get('/api/list-txt-files', (req, res) => {
  const FZ_TXT_DIR = path.join(PUBLIC_DIR, 'fz_txt');
  const results = [];
  try {
    fs.readdirSync(GESTALT_DIR)
      .filter(f => f.endsWith('.txt'))
      .forEach(f => results.push({ name: f, fetchPath: `Gestalt/${f}` }));
  } catch {}
  try {
    fs.readdirSync(FZ_TXT_DIR)
      .filter(f => f.endsWith('.txt'))
      .forEach(f => results.push({ name: f, fetchPath: `fz_txt/${f}` }));
  } catch {}
  res.json(results);
});

// Endpoint to list .md files available for editing
app.get('/api/list-md-files', (req, res) => {
  const FZ_MD_DIR  = path.join(PUBLIC_DIR, 'fz_md');
  const FZ_TXT_DIR = path.join(PUBLIC_DIR, 'fz_txt');
  const results = [];
  try {
    fs.readdirSync(FZ_MD_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .forEach(f => results.push({ name: f, fetchPath: `fz_md/${f}` }));
  } catch {}
  try {
    fs.readdirSync(FZ_TXT_DIR)
      .filter(f => f.endsWith('.md'))
      .forEach(f => results.push({ name: f, fetchPath: `fz_txt/${f}` }));
  } catch {}
  res.json(results);
});

app.get('/api/list-fz-files', (req, res) => {
  try {
    const files = fs.readdirSync(GESTALT_DIR);
    const numbers = files
      .map(f => { const m = f.match(/^fz(\d{4,})\.json$/); return m ? parseInt(m[1], 10) : null; })
      .filter(n => n !== null);
    res.json({ numbers });
  } catch (err) {
    console.error('[list-fz-files] Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to list files.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint to overwrite fz_puck_index.json (used by PUCK Library "Save Index")
app.post('/api/save-puck-index', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ status: 'error', message: 'Missing content.' });
    const PUCK_DIR = path.join(PUBLIC_DIR, 'fz_PUCK_data');
    const indexPath = path.join(PUCK_DIR, 'fz_puck_index.json');
    fs.writeFileSync(indexPath, content, 'utf8');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Save PUCK Index] Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save index.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Endpoint to save a PUCK file to fz_PUCK_data/ and update fz_puck_index.json
app.post('/api/save-puck', (req, res) => {
  try {
    const { filename, content, indexEntry } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ status: 'error', message: 'Missing filename or content.' });
    }
    const PUCK_DIR = path.join(PUBLIC_DIR, 'fz_PUCK_data');
    const puckPath = safeFilePath(PUCK_DIR, filename);
    if (!puckPath) {
      return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
    }
    // Write the PUCK file
    fs.writeFileSync(puckPath, content, 'utf8');

    // Update fz_puck_index.json if an indexEntry was provided
    if (indexEntry && typeof indexEntry === 'object') {
      const indexPath = path.join(PUCK_DIR, 'fz_puck_index.json');
      let entries = [];
      if (fs.existsSync(indexPath)) {
        try { entries = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch {}
      }
      if (!Array.isArray(entries)) entries = [];
      // Replace existing entry with same filename, or append
      const existingIdx = entries.findIndex(e => e.filename === filename);
      if (existingIdx >= 0) {
        entries[existingIdx] = indexEntry;
      } else {
        entries.push(indexEntry);
      }
      fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2), 'utf8');
    }

    res.json({ status: 'ok', message: 'PUCK saved and index updated.' });
  } catch (err) {
    console.error('[Save PUCK] Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save PUCK.' });
  }
});

// Endpoint to save (stage and publish) fz_profile_index.json with backup
app.post('/api/save-profile-index', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ status: 'error', message: 'Missing content.' });
    }
    const indexPath = path.join(PUBLIC_DIR, 'Gestalt', 'fz_profile_index.json');
    const backupPath = indexPath + '.bck';
    // Backup current index if exists
    if (fs.existsSync(indexPath)) {
      try {
        fs.copyFileSync(indexPath, backupPath);
        console.log('[Profile Index] Backup created/updated:', backupPath);
      } catch (err) {
        console.error('[Profile Index] Backup failed:', err);
      }
    }
    fs.writeFileSync(indexPath, content, 'utf8');
    res.json({ status: 'ok', message: 'Profile index saved and backup created.' });
  } catch (err) {
    console.error('[Profile Index] Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save profile index.' });
  }
});
