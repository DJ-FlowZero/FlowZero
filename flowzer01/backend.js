const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());

// Endpoint to list all fzxxxx.json files in public and return their numbers
app.get('/api/list-fz-files', (req, res) => {
  const GESTALT_DIR = path.join(__dirname, 'public', 'Gestalt');
  fs.readdir(GESTALT_DIR, (err, files) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Failed to read public dir' });
    const nums = files
      .map(fn => {
        const m = fn.match(/^fz(\d{4,})\.json$/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter(n => n !== null);
    res.json({ status: 'ok', numbers: nums });
  });
});

const PUBLIC_DIR = path.join(__dirname, 'public');
const NEWSTATE_DIR = path.join(PUBLIC_DIR, 'NewState');
const FILENAME = 'text_text.txt';

// Endpoint to save (stage) the file to NewState with timestamp
app.post('/api/save-text', (req, res) => {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  const content = req.body.content || '';
  fs.writeFileSync(path.join(NEWSTATE_DIR, FILENAME), content, 'utf8');
  res.json({ status: 'ok', message: 'File saved to NewState', timestamp });
});

// Endpoint to refresh (publish) the file from NewState to public
app.post('/api/refresh-text', (req, res) => {
  const src = path.join(NEWSTATE_DIR, FILENAME);
  const dest = path.join(PUBLIC_DIR, FILENAME);
  if (!fs.existsSync(src)) {
    return res.status(404).json({ status: 'error', message: 'No staged file found.' });
  }
  fs.copyFileSync(src, dest);
  res.json({ status: 'ok', message: 'File refreshed to public.' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
