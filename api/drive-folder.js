// Lista os arquivos da pasta pública do Drive (server-side, sem CORS).
// GET /api/drive-folder?id=<folderId>  ->  { files: [{id, name}] }
export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!id) return res.status(400).json({ error: 'missing id' });
  try {
    const r = await fetch('https://drive.google.com/embeddedfolderview?id=' + id + '#list', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!r.ok) return res.status(502).json({ error: 'drive ' + r.status, files: [] });
    const html = await r.text();
    const files = [];
    const seen = new Set();
    const re = /<div class="flip-entry"[^>]*id="entry-([A-Za-z0-9_-]{20,})"[\s\S]*?flip-entry-title">([^<]*)</g;
    let m;
    while ((m = re.exec(html))) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      files.push({ id: m[1], name: m[2].trim() });
    }
    if (!files.length) {
      const re2 = /data-id="([A-Za-z0-9_-]{20,})"/g;
      while ((m = re2.exec(html))) {
        if (seen.has(m[1])) continue;
        seen.add(m[1]);
        files.push({ id: m[1], name: '' });
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ folder: id, count: files.length, files });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e), files: [] });
  }
}
