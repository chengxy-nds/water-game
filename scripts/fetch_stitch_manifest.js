import fs from 'fs';
import https from 'https';

const API_KEY = 'AQ.Ab8RN6J0r0gUg64mM6ul4LM_zzpKFMECpE-f-wGzycVp_HTBbg';

function rpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
    const options = {
      hostname: 'stitch.googleapis.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Goog-Api-Key': API_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const listRes = await rpc('tools/call', {
    name: 'list_screens',
    arguments: { projectId: 'projects/6713590118866054197' },
  });
  const data = JSON.parse(listRes.result.content[0].text);
  const screens = data.screens || [];

  if (!fs.existsSync('raw_assets')) {
    fs.mkdirSync('raw_assets', { recursive: true });
  }

  fs.writeFileSync('raw_assets/stitch_screens_manifest.json', JSON.stringify(screens, null, 2));

  console.log(`Successfully fetched ${screens.length} screens from Stitch project!`);
  screens.slice(0, 15).forEach((s, idx) => {
    const id = s.name.split('/').pop();
    const title = (s.title || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    console.log(`${idx + 1}. [${id}] ${title}`);
  });
}

run().catch(console.error);
