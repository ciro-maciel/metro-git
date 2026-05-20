/* ─────────────────────────────────────────────────────────────────────
   Progresso do jogador — persistido no `localStorage` do navegador.

   Não há servidor nem login: o progresso é local à máquina. Funciona
   igual servido por Bun ou como build estático no GitHub Pages.
   ───────────────────────────────────────────────────────────────────── */

const KEY = 'metrogit:progress';

/* Lê o mapa de progresso: { [levelId]: { status } }. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};   // localStorage indisponível (modo privado, etc.)
  }
}

/* Marca um nível como concluído e desbloqueia o próximo da sequência. */
export function completeLevel(levelId, levelIds) {
  const map = loadProgress();
  map[levelId] = { status: 'completed' };

  const nextId = levelIds[levelIds.indexOf(levelId) + 1];
  if (nextId && map[nextId]?.status !== 'completed') {
    map[nextId] = { status: 'unlocked' };
  }
  save(map);
}

function save(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch { /* sem persistência — o jogo segue, só não salva */ }
}
