/* ─────────────────────────────────────────────────────────────────────
   Ícones Tabler — caminhos SVG inline (stroke 2, viewBox 24×24).

   Inline em vez de CDN: confiável offline, herda `currentColor`, e o
   sistema RiLiGar pede Tabler como o único conjunto de ícones.
   Cada entrada é só o conteúdo interno do <svg>.
   ───────────────────────────────────────────────────────────────────── */

const PATHS = {
  /* tabler: map-pin — Nova Estação */
  station: '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"/>',
  /* tabler: git-branch — Abrir Linha */
  line: '<path d="M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M7 8v8"/><path d="M9 18h6a2 2 0 0 0 2 -2v-5"/><path d="M14 14l3 -3l3 3"/>',
  /* tabler: train — Embarcar */
  board: '<path d="M3 11h18"/><path d="M5 19l-2 2"/><path d="M21 21l-2 -2"/><path d="M12 3c-3.866 0 -7 .56 -7 4v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-9c0 -3.44 -3.134 -4 -7 -4z"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  /* tabler: arrows-join — Convergir */
  converge: '<path d="M3 3v4.51a4 4 0 0 0 1.318 2.974l3.364 3.032a4 4 0 0 1 1.318 2.974v4.51"/><path d="M21 3v4.51a4 4 0 0 1 -1.318 2.974l-3.364 3.032a4 4 0 0 0 -1.318 2.974v4.51"/><path d="M12 22v-9"/>',
  /* tabler: target — objetivo */
  target: '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>',
  /* tabler: circle-check — concluído */
  check: '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 12l2 2l4 -4"/>',
  /* tabler: arrow-right — avançar */
  arrowRight: '<path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/>',
  /* tabler: arrow-left — voltar */
  arrowLeft: '<path d="M5 12l14 0"/><path d="M5 12l6 6"/><path d="M5 12l6 -6"/>',
  /* tabler: train — decoração do canvas / rede.
     Mesmo conjunto de traços do ícone "Embarcar": corpo do vagão, trilho
     na base, janelas e as faíscas das rodas. */
  train: '<path d="M3 11h18"/><path d="M5 19l-2 2"/><path d="M21 21l-2 -2"/><path d="M12 3c-3.866 0 -7 .56 -7 4v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-9c0 -3.44 -3.134 -4 -7 -4z"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  /* tabler: sparkles — revelação */
  sparkles: '<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"/>',
};

/* Devolve uma string <svg> pronta para innerHTML.
   `size` em px, `stroke` em px, herda a cor via currentColor. */
export function icon(name, { size = 18, stroke = 2, cls = '' } = {}) {
  const body = PATHS[name];
  if (!body) return '';
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="${stroke}"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* Para o Canvas: desenha um ícone Tabler num contexto 2D.
   Reaproveita os mesmos paths via Path2D. */
export function drawIcon(ctx, name, x, y, size, color, alpha = 1, stroke = 2) {
  const body = PATHS[name];
  if (!body) return;
  const scale = size / 24;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke / scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  /* Extrai o atributo d="..." de cada <path> e desenha. */
  const dMatches = body.match(/d="([^"]+)"/g) || [];
  for (const m of dMatches) {
    const d = m.slice(3, -1);
    ctx.stroke(new Path2D(d));
  }
  ctx.restore();
}
