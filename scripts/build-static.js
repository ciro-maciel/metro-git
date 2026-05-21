/* ─────────────────────────────────────────────────────────────────────
   Build estático — monta docs/ para o GitHub Pages.

   O GitHub Pages só serve arquivos estáticos: não há servidor Bun/Elysia
   nem SQLite. Este script gera uma versão 100% client-side do jogo —
   o progresso passa a viver no localStorage do navegador.

   Saída (docs/):
     index.html        — a página do jogo, com caminhos relativos
     .nojekyll         — impede o Jekyll de processar a pasta
     CNAME             — domínio custom do GitHub Pages
     public/...        — css, js e assets copiados de public/

   Uso:  bun run build:static
   ───────────────────────────────────────────────────────────────────── */

import { mkdir, rm, cp } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = `${ROOT}docs`;

/* Domínio de produção (GitHub Pages + CNAME). Absoluto — exigido por
   og:url, canonical e og:image; crawlers não resolvem caminhos "./".
   Forçamos https: o GitHub Pages só serve por TLS e og:image:secure_url
   exige https — mesmo que o .env de dev traga um SITE_URL com http. */
const SITE_URL = (process.env.SITE_URL ?? 'https://metro-git.ciromaciel.click')
  .replace(/\/$/, '')
  .replace(/^http:/, 'https:');

/* SEO neutro — espelha src/views/layout.js. Descreve o jogo de metrô,
   nunca o Git por trás dele. A pista é o ícone do Git na og-image. */
const SEO = {
  description:
    'Construa linhas, abra estações e conduza o trem. Um jogo de ' +
    'estratégia onde você opera uma rede de metrô que cresce a cada ' +
    'nível. Jogue no navegador, sem cadastro.',
  ogTitle: 'Metrô — Opere a Rede',
  ogImage: `${SITE_URL}/public/assets/og-image.png`,
  locale: 'pt_BR',
  themeColor: '#34322D',
};

/* JSON-LD — VideoGame + WebSite, idêntico ao do servidor. */
const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'VideoGame',
      name: SEO.ogTitle,
      url: SITE_URL,
      description: SEO.description,
      image: SEO.ogImage,
      genre: ['Strategy', 'Puzzle', 'Educational'],
      gamePlatform: 'Web browser',
      applicationCategory: 'Game',
      operatingSystem: 'Any',
      inLanguage: 'pt-BR',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    },
    {
      '@type': 'WebSite',
      name: SEO.ogTitle,
      url: SITE_URL,
      inLanguage: 'pt-BR',
    },
  ],
});

/* ── 1. Limpa e recria docs/ ────────────────────────────────────────── */
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

/* ── 2. Copia os estáticos de public/ ───────────────────────────────── */
await cp(`${ROOT}public/css`, `${OUT}/public/css`, { recursive: true });
await cp(`${ROOT}public/js`, `${OUT}/public/js`, { recursive: true });
await cp(`${ROOT}public/assets`, `${OUT}/public/assets`, { recursive: true });

/* ── 3. Gera o index.html ───────────────────────────────────────────── */
/* O jogo é todo client-side; o HTML aqui é o mesmo do playPage do
   servidor, mas fixo e sem o window.__PROGRESS__ (agora vem do
   localStorage). Caminhos com "./" para funcionar em subdiretório. */
const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opere a Rede · Metrô</title>
  <meta name="description" content="${SEO.description}" />
  <meta name="theme-color" content="${SEO.themeColor}" />
  <link rel="canonical" href="${SITE_URL}/" />
  <meta name="robots" content="index, follow" />

  <!-- Ícones -->
  <link rel="icon" type="image/webp" href="./public/assets/favicon.webp" />
  <link rel="apple-touch-icon" href="./public/assets/apple-touch-icon.png" />

  <!-- Open Graph — preview ao compartilhar (LinkedIn, WhatsApp, etc.).
       Copy neutra de propósito; a imagem traz o ícone do Git como
       marca d'água, a única pista da revelação. URLs absolutas: os
       crawlers não resolvem caminhos relativos. -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Metrô" />
  <meta property="og:locale" content="${SEO.locale}" />
  <meta property="og:title" content="${SEO.ogTitle}" />
  <meta property="og:description" content="${SEO.description}" />
  <meta property="og:url" content="${SITE_URL}/" />
  <meta property="og:image" content="${SEO.ogImage}" />
  <meta property="og:image:secure_url" content="${SEO.ogImage}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Mapa de uma rede de metrô — Opere a Rede" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${SEO.ogTitle}" />
  <meta name="twitter:description" content="${SEO.description}" />
  <meta name="twitter:image" content="${SEO.ogImage}" />
  <meta name="twitter:image:alt" content="Mapa de uma rede de metrô — Opere a Rede" />

  <!-- Dados estruturados -->
  <script type="application/ld+json">${jsonLd}</script>

  <link rel="stylesheet" href="./public/css/tokens.css" />
  <link rel="stylesheet" href="./public/css/app.css" />
  <script type="module" src="./public/js/game/main.js"></script>
</head>
<body>
${stageMarkup()}
</body>
</html>
`;

await Bun.write(`${OUT}/index.html`, html);

/* ── 4. .nojekyll — o GitHub Pages não deve rodar Jekyll na pasta ───── */
await Bun.write(`${OUT}/.nojekyll`, '');

/* ── 5. CNAME — o domínio custom. Recriar docs/ apaga o arquivo, então
       o build precisa reescrevê-lo, ou o GitHub Pages perde o domínio. */
await Bun.write(`${OUT}/CNAME`, `${new URL(SITE_URL).host}\n`);

console.log('Build estático pronto em docs/ — pronto para o GitHub Pages.');

/* O markup do palco — espelha src/views/pages.js (playPage), mas estático. */
function stageMarkup() {
  return `<div class="stage">
  <div class="stage__map">
    <a class="brand" href="https://ciromaciel.click/" target="_blank" rel="noopener">
      <svg class="brand__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M11 8a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M12 15v-6" />
        <path d="M15 11l-2 -2" />
        <path d="M11 7l-1.9 -1.9" />
        <path d="M13.446 2.6l7.955 7.954a2.045 2.045 0 0 1 0 2.892l-7.955 7.955a2.045 2.045 0 0 1 -2.892 0l-7.955 -7.955a2.045 2.045 0 0 1 0 -2.892l7.955 -7.955a2.045 2.045 0 0 1 2.892 0" />
      </svg>
      <span class="brand__text">
        <strong class="brand__name">MetroGit</strong>
        <span class="brand__by">by Ciro Cesar Maciel</span>
      </span>
    </a>

    <header class="hud hud--top">
      <span class="eyebrow eyebrow--strong" id="level-eyebrow">Nível 01 — Partida</span>
      <h1 class="hud__title" id="level-title">Construa a Linha</h1>
    </header>

    <aside class="guide" id="guide" aria-label="Guia da meta">
      <div class="guide__top">
        <span class="guide__eyebrow"><span id="guide-icon"></span> Sua meta</span>
        <h2 class="guide__task" id="guide-task">Abra 3 estações.</h2>
      </div>
      <div class="guide__progress">
        <div class="guide__progress-bar"><span id="guide-bar"></span></div>
        <span class="guide__progress-label" id="guide-count">0 de 1</span>
      </div>
      <ol class="guide__steps" id="guide-steps"></ol>
      <div class="guide__hint" id="guide-hint">
        <span id="hint-icon"></span>
        <span id="hint-text"></span>
      </div>
    </aside>

    <svg class="map-watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M11 8a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M12 15v-6" />
      <path d="M15 11l-2 -2" />
      <path d="M11 7l-1.9 -1.9" />
      <path d="M13.446 2.6l7.955 7.954a2.045 2.045 0 0 1 0 2.892l-7.955 7.955a2.045 2.045 0 0 1 -2.892 0l-7.955 -7.955a2.045 2.045 0 0 1 0 -2.892l7.955 -7.955a2.045 2.045 0 0 1 2.892 0" />
    </svg>
    <canvas id="metro-canvas" width="1920" height="1080" role="img" aria-label="Mapa da rede de metrô"></canvas>
    <p class="sr-only" id="canvas-narration" aria-live="polite"></p>
    <div class="activity" id="activity" aria-live="polite"></div>
  </div>

  <footer class="stage__bar">
    <div class="controls" id="controls" role="group" aria-label="Controles do metrô"></div>
    <div class="nav-cluster">
      <span class="hud__progress" id="level-status">Nível 1 de 3</span>
      <button class="btn btn--secondary btn--sm" id="prev-level" disabled>Nível anterior</button>
      <button class="btn btn--primary btn--sm" id="next-level" disabled>Próximo nível</button>
    </div>
  </footer>
</div>`;
}
