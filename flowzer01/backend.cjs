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
const NEWSTATE_DIR = path.join(PUBLIC_DIR, 'NewState');
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
    if (!filename) {
      return res.status(400).json({ status: 'error', message: 'Missing filename.' });
    }
    const profilePath = safeFilePath(GESTALT_DIR, filename);
    if (!profilePath) {
      return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
    }
    const backupPath = profilePath + '.bck';
    if (fs.existsSync(profilePath)) {
      try {
        fs.copyFileSync(profilePath, backupPath);
      } catch (err) {
        console.error('[Profile Backup] Backup failed:', err);
      }
    }
    fs.writeFileSync(profilePath, content || '', 'utf8');
    res.json({ status: 'ok', message: 'Profile saved to NewState (backup created if previous version existed)', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) });
  } catch (err) {
    console.error('[Profile Save] Write error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save profile.' });
  }
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

// Endpoint to refresh (publish) a text file from NewState staging to Gestalt dir
app.post('/api/refresh-text', (req, res) => {
  const file = req.body.filename || FILENAME;
  const safeStaged = safeFilePath(NEWSTATE_DIR, file);
  const safeDest = safeFilePath(GESTALT_DIR, file);
  if (!safeStaged || !safeDest) {
    return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
  }
  if (!fs.existsSync(safeStaged)) {
    return res.status(404).json({ status: 'error', message: 'No staged file found in NewState.' });
  }
  const backupPath = safeDest + '.bck';
  if (fs.existsSync(safeDest)) {
    try { fs.copyFileSync(safeDest, backupPath); } catch {}
  }
  fs.copyFileSync(safeStaged, safeDest);
  res.json({ status: 'ok', message: 'File refreshed from NewState to Gestalt.' });
});

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

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
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
