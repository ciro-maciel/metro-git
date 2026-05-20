/* ─────────────────────────────────────────────────────────────────────
   Action layer — what the metro buttons actually do.

   Buttons call these. They mutate state directly (no command string) and
   return a metro-flavored log line. The real Git command stays hidden
   until the reveal; `actions.js` is the pre-reveal driver.
   ───────────────────────────────────────────────────────────────────── */
import { commit, branch, checkout, merge } from './state.js';

/* Nomes de linha de metrô, distribuídos em ordem — o jogador nunca digita um.
   Sem cores nos nomes: o sistema é monocromático, cor é só status. */
const LINE_NAMES = ['Linha Litoral', 'Linha Anel', 'Linha Rio', 'Linha Parque'];

export function nextLineName(state) {
  const used = Object.keys(state.branches).length - 1; // minus 'main'
  return LINE_NAMES[used % LINE_NAMES.length];
}

/* Each returns { text } for the activity log, in metro language. */
export const Actions = {
  station(state) {
    commit(state, `parada ${state.head}`);
    /* Conta estações *desta linha* — bate com o rótulo "Estação N" do canvas. */
    const n = Object.values(state.commits)
      .filter((c) => c.branch === state.head).length;
    return { text: `Estação ${n} aberta na ${displayName(state, state.head)}.` };
  },

  line(state) {
    const name = nextLineName(state);
    branch(state, name);
    return { text: `${name} aberta — ela se ramifica daqui.` };
  },

  board(state) {
    /* Rodízio: cada clique leva o trem para a PRÓXIMA linha aberta.
       Ao passar da última, volta para a primeira. Só o botão controla
       isto — não há seleção nem clique no mapa. */
    const lines = Object.keys(state.branches);
    if (lines.length < 2)
      return { text: 'Nenhuma outra linha para embarcar.', muted: true };

    const current = lines.indexOf(state.head);
    const next = lines[(current + 1) % lines.length];
    checkout(state, next);
    return { text: `Trem levado para a ${displayName(state, next)}.` };
  },

  converge(state) {
    /* Converge a linha mais nova que não é a que o trem percorre. */
    const source = Object.keys(state.branches).reverse()
      .find((b) => b !== state.head);
    if (!source) return { text: 'Nenhuma linha para convergir.', muted: true };
    const res = merge(state, source);
    if (res.kind === 'noop')
      return { text: 'As linhas já compartilham as mesmas estações.', muted: true };
    if (res.kind === 'fast-forward')
      return { text: `${displayName(state, state.head)} estendida até encontrar a ${displayName(state, source)}.` };
    return { text: `Interligação construída — ${displayName(state, state.head)} e ${displayName(state, source)} agora se encontram.` };
  },
};

/* 'main' aparece como "Linha Central" para o jogador; demais linhas mantêm o nome. */
function displayName(state, branchName) {
  return branchName === 'main' ? 'Linha Central' : branchName;
}
