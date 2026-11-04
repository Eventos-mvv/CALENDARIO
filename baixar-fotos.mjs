// Baixa as fotos listadas em src/data/media.json para public/fotos/<evento>/<n>.jpg
// e ativa o uso das cópias locais (VITE_LOCAL_PHOTOS=1 em .env.local).
// Uso: npm run fotos
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const media = JSON.parse(readFileSync('src/data/media.json', 'utf8'));
let ok = 0;
let fail = 0;

for (const [id, entry] of Object.entries(media)) {
  if (typeof entry !== 'object' || !entry.photos) continue;
  const dir = `public/fotos/${id}`;
  mkdirSync(dir, { recursive: true });
  for (const [i, url] of entry.photos.entries()) {
    const file = `${dir}/${i + 1}.jpg`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'calendario-mvv-2027' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      ok++;
      console.log(`ok   ${file}`);
    } catch (err) {
      fail++;
      console.warn(`erro ${id} #${i + 1}: ${err.message} (${url})`);
    }
  }
}

const envFile = '.env.local';
const env = existsSync(envFile) ? readFileSync(envFile, 'utf8').replace(/^VITE_LOCAL_PHOTOS=.*\n?/m, '') : '';
writeFileSync(envFile, `${env}VITE_LOCAL_PHOTOS=1\n`);
console.log(`\n${ok} fotos baixadas, ${fail} com erro. O site agora usa as cópias locais (rode npm run build).`);
