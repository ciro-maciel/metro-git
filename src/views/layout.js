/* Shell HTML compartilhado. Carrega os tokens do design RiLiGar, os
   estilos da aplicação e o HTMX.

   `brand` tem um sufixo neutro por padrão — a página do jogo NÃO pode pôr
   "Git" na aba do navegador, ou estraga a revelação antes de o jogador
   sequer jogar. */
export function layout({ title, body, head = '', brand = 'Metrô' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · ${brand}</title>
  <link rel="icon" href="/public/assets/favicon.webp" />
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
