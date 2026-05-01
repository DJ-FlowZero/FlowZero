# Text File Editor

> Edit any `.txt` file in `fz_txt/` — spec docs, glossary, code plan, daily blog — directly in the app, with automatic backup on every save.

Version History panel shows the last 10 saves. Restore any of them with one click.

---

## Workflow

1. Select a file from the dropdown
2. Edit in the text area
3. **Save** — writes to server, creates a timestamped backup
4. **↺ Reload** — discards local draft, re-fetches from server

## Typical use

Daily blog entries (`FZ_99_DailyBlog.txt`), spec updates, glossary additions — anything that belongs in the MAP artifact store. The file that closes the loop for the next session.
