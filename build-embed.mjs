// Monta dist-embed/calendario-mvv-2027.html (arquivo único) a partir do build incorporado.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = 'dist-embed';
const js = readFileSync(`${dir}/app.js`, 'utf8');
const cssFile = readdirSync(dir).find((f) => f.endsWith('.css'));
const css = cssFile ? readFileSync(`${dir}/${cssFile}`, 'utf8') : '';
const safeJs = js.replace(/<\/script/gi, '<\\/script');

const html = `<title>Calendário de Eventos MVV 2027</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Calendário Oficial de Eventos do Ministério Verbo da Vida em 2027.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap">
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${safeJs}</script>
`;
writeFileSync(`${dir}/calendario-mvv-2027.html`, html);
console.log(`ok: ${dir}/calendario-mvv-2027.html (${(html.length / 1024).toFixed(1)} KB)`);
