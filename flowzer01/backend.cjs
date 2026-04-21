const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json({ limit: '5mb' }));

const PUBLIC_DIR = path.join(__dirname, 'public');
const NEWSTATE_DIR = path.join(PUBLIC_DIR, 'NewState');
const FILENAME = 'text_text.txt';


// Endpoint to save (stage) a profile JSON file to NewState with backup
app.post('/api/save-profile', (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename) {
      return res.status(400).json({ status: 'error', message: 'Missing filename.' });
    }
    const profilePath = path.join(NEWSTATE_DIR, filename);
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
    const src = path.join(NEWSTATE_DIR, filename);
    const dest = path.join(PUBLIC_DIR, filename);
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
  const filePath = path.join(NEWSTATE_DIR, file);
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
  const dest = path.join(PUBLIC_DIR, file);
  const backupPath = dest + '.bck';
  if (!fs.existsSync(src)) {
    return res.status(404).json({ status: 'error', message: 'No staged file found.' });
  }
  // Backup the current public file before overwrite
  if (fs.existsSync(dest)) {
    try { fs.copyFileSync(dest, backupPath); } catch {}
  }
  fs.copyFileSync(src, dest);
  res.json({ status: 'ok', message: 'File refreshed to public.' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
