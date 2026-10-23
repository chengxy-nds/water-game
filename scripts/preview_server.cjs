const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  let filePath = path.join(root, req.url.split('?')[0]);
  if (req.url === '/' || req.url === '/preview') {
    filePath = path.join(root, 'public', 'preview_canvas.html');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png'
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(8089, () => {
  console.log('Preview server running on http://127.0.0.1:8089/preview');
});
