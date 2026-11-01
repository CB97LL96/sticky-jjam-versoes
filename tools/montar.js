// Gera site/assets/jellylib.js (motor da geleia) e coloca o logo inline no index.html.
// Rodar na raiz: node site/tools/montar.js
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..', '..');
require(path.join(root, 'node_modules/esbuild')).buildSync({
  entryPoints: [path.join(__dirname, 'entry.js')], bundle: true, minify: true, format: 'iife', target: 'chrome110',
  outfile: path.join(root, 'site/assets/jellylib.js'), loader: { '.json': 'json' },
});
const html = path.join(root, 'site/index.html');
let s = fs.readFileSync(html, 'utf8');
const logo = fs.readFileSync(path.join(root, 'site/assets/logo.svg'), 'utf8').replace(/^<svg /, '<svg id="logo-svg" class="logo" role="img" aria-label="STICKY JJAM" ');
s = s.replace(/<!--logo-->[\s\S]*?<!--\/logo-->/, '<!--logo-->' + logo + '<!--/logo-->');
fs.writeFileSync(html, s);
console.log('ok', (fs.statSync(path.join(root, 'site/assets/jellylib.js')).size / 1024).toFixed(0) + ' KB');
