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


// Endpoint to save (stage) a profile JSON file to NewState with backup
app.post('/api/save-profile', (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename) {
      return res.status(400).json({ status: 'error', message: 'Missing filename.' });
    }
    const profilePath = path.join(GESTALT_DIR, filename);
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

// Endpoint to refresh (publish) a profile file from NewState to public
app.post('/api/refresh-profile', (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ status: 'error', message: 'Missing filename.' });
    }
    const src = path.join(GESTALT_DIR, filename);
    const dest = path.join(GESTALT_DIR, filename); // publish stays in Gestalt
    const backupPath = dest + '.bck';
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


// Endpoint to save (stage) the file to NewState with timestamp
app.post('/api/save-text', (req, res) => {
  const file = req.body.filename || FILENAME;
  const content = req.body.content || "";
  const filePath = path.join(GESTALT_DIR, file);
  const backupPath = filePath + '.bck';
  if (fs.existsSync(filePath)) {
    try { fs.copyFileSync(filePath, backupPath); } catch {}
  }
  fs.writeFileSync(filePath, content, 'utf8');
  res.json({ status: 'ok' });
});

// Endpoint to refresh (publish) the file from NewState to public
app.post('/api/refresh-text', (req, res) => {
  const file = req.body.filename || FILENAME;
  const src = path.join(NEWSTATE_DIR, file);
  const dest = path.join(PUBLIC_DIR, 'fz_txt', file);
  const backupPath = dest + '.bck';
  if (!fs.existsSync(src)) {
    return res.status(404).json({ status: 'error', message: 'No staged file found.' });
  }
  // Backup the current fz_txt file before overwrite
  if (fs.existsSync(dest)) {
    try { fs.copyFileSync(dest, backupPath); } catch {} 
  }
  fs.copyFileSync(src, dest);
  res.json({ status: 'ok', message: 'File refreshed to fz_txt.' });
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
