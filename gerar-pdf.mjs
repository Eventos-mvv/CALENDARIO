// Gera public/calendario-mvv-2027.pdf a partir da folha de impressão do site.
// Uso: npm run build && npx vite preview --port 4173 (em outro terminal) && node scripts/gerar-pdf.mjs
// Requer o Playwright: npm i -D playwright && npx playwright install chromium
import { chromium } from 'playwright';

const url = process.env.PDF_URL ?? 'http://localhost:4173/#ano';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: 'public/calendario-mvv-2027.pdf', preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log('ok: public/calendario-mvv-2027.pdf');
