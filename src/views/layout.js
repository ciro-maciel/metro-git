/* Shell HTML compartilhado. Carrega os tokens do design RiLiGar, os
   estilos da aplicação e o HTMX.

   `brand` tem um sufixo neutro por padrão — a página do jogo NÃO pode pôr
   "Git" na aba do navegador, ou estraga a revelação antes de o jogador
   sequer jogar. A mesma regra vale para o Open Graph: o preview que sai
   no LinkedIn, WhatsApp e afins é DELIBERADAMENTE neutro. A única pista é
   o ícone do Git usado como marca d'água na imagem de compartilhamento —
   quem conhece o logo reconhece; quem não conhece vê só um metrô. */

/* URL de produção. Absoluta — exigida por og:url, canonical e og:image.
   Sobrescreva com SITE_URL no .env; o fallback é o domínio publicado. */
const SITE_URL = (process.env.SITE_URL ?? 'http://metro-git.ciromaciel.click')
  .replace(/\/$/, '');

/* SEO neutro — descreve o jogo de metrô, nunca o Git por trás dele. */
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

export function layout({
  title,
  body,
  head = '',
  brand = 'Metrô',
  path = '/',
}) {
  const pageTitle = `${title} · ${brand}`;
  const canonical = `${SITE_URL}${path}`;

  /* JSON-LD — VideoGame + WebSite. Mantém o vocabulário neutro: é um
     "jogo de estratégia de metrô", sem uma palavra sobre Git. */
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        name: 'Metrô — Opere a Rede',
        url: SITE_URL,
        description: SEO.description,
        image: SEO.ogImage,
        genre: ['Strategy', 'Puzzle', 'Educational'],
        gamePlatform: 'Web browser',
        applicationCategory: 'Game',
        operatingSystem: 'Any',
        inLanguage: 'pt-BR',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BRL',
        },
      },
      {
        '@type': 'WebSite',
        name: 'Metrô — Opere a Rede',
        url: SITE_URL,
        inLanguage: 'pt-BR',
      },
    ],
  });

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${pageTitle}</title>
  <meta name="description" content="${SEO.description}" />
  <meta name="theme-color" content="${SEO.themeColor}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow" />

  <!-- Ícones -->
  <link rel="icon" type="image/webp" href="/public/assets/favicon.webp" />
  <link rel="apple-touch-icon" href="/public/assets/apple-touch-icon.png" />

  <!-- Open Graph — preview ao compartilhar (LinkedIn, WhatsApp, etc.).
       Copy neutra de propósito; a imagem traz o ícone do Git como
       marca d'água, a única pista da revelação. -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Metrô" />
  <meta property="og:locale" content="${SEO.locale}" />
  <meta property="og:title" content="${SEO.ogTitle}" />
  <meta property="og:description" content="${SEO.description}" />
  <meta property="og:url" content="${canonical}" />
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

  <link rel="stylesheet" href="/public/css/tokens.css" />
  <link rel="stylesheet" href="/public/css/app.css" />
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  ${head}
</head>
<body>
  ${body}
</body>
</html>`;
}
