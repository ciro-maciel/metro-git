/* ─────────────────────────────────────────────────────────────────────
   Level definitions — discovery mode.

   Pre-reveal, the player only sees METRO language. The word "Git" and any
   command syntax never appear until the reveal fires after level 3.

   Each `action` is what a button does. `git` is the real command behind it,
   shown only in the post-level-3 reveal overlay.
   ───────────────────────────────────────────────────────────────────── */

/* O vocabulário de controle do metrô. A revelação mapeia ação -> git.
   Os comandos `git` permanecem em inglês — são literais que o jogador
   vai digitar de verdade num terminal.

   `icon`  — nome do ícone Tabler (ver icons.js)
   `hint`  — explicação completa, sempre visível no botão
   `gitHint` — o que o comando Git faz, mostrado pós-revelação */
export const ACTIONS = {
  station: {
    label: 'Nova Estação',
    icon: 'station',
    hint: 'Cria uma parada nova logo à frente do trem e o leva até ela. Cada parada fica fixa no mapa para sempre.',
    git: 'git commit',
    gitHint: 'Salva o estado atual como um ponto permanente no histórico.',
  },
  line: {
    label: 'Abrir Linha',
    icon: 'line',
    hint: 'Ramifica uma linha nova a partir da parada atual. Ela começa idêntica e depois segue seu próprio caminho.',
    git: 'git branch',
    gitHint: 'Cria uma branch — uma trilha de trabalho paralela.',
  },
  board: {
    label: 'Embarcar',
    icon: 'board',
    hint: 'Move seu trem para a próxima linha aberta — cada vez que você pressiona, ele avança uma linha e volta ao começo no fim. As estações que você abrir passam a ser construídas onde o trem está.',
    git: 'git checkout',
    gitHint: 'Troca a branch ativa — move o HEAD para outra trilha.',
  },
  converge: {
    label: 'Convergir',
    icon: 'converge',
    hint: 'Faz outra linha correr para dentro da que o trem percorre, criando uma estação de interligação onde elas se encontram.',
    git: 'git merge',
    gitHint: 'Une duas branches, juntando o trabalho de ambas.',
  },
};

/* Cada nível tem `steps[]` — sub-passos do guia de meta. Cada passo:
   `label`    — o que fazer, em linguagem de metrô
   `done(s)`  — true quando o passo está cumprido (lê o estado)
   `progress(s)` — opcional, devolve { current, total } para contar passos
                   repetidos (ex.: abrir 3 estações).
   `why` é a frase de sentido do nível (sem entregar que é Git). */
export const LEVELS = [
  {
    id: 'commit',
    index: 1,
    eyebrow: 'Nível 01 — Partida',
    title: 'Construa a Linha',
    /* Enquadramento puro de metrô — nenhuma menção a commits ou Git. */
    brief:
      'Seu trem está parado no pátio. Construa a linha à frente dele — cada nova estação que o trem alcança vira uma parada fixa no mapa.',
    task: 'Abra 3 estações.',
    why: 'Cada parada que você abre fica registrada para sempre. É a memória do mapa: nada que você construir se perde.',
    actions: ['station'],
    steps: [
      {
        label: 'Abrir 3 estações na linha',
        done: (s) => Object.keys(s.commits).length >= 3,
        progress: (s) => ({ current: Math.min(3, Object.keys(s.commits).length), total: 3 }),
      },
    ],
    check: (s) => Object.keys(s.commits).length >= 3,
  },
  {
    id: 'branch',
    index: 2,
    eyebrow: 'Nível 02 — Bifurcação',
    title: 'Uma Segunda Linha',
    brief:
      'Uma linha só não é uma rede. Abra uma segunda linha que se ramifica da primeira, leve seu trem até ela e dê a ela uma estação própria.',
    task: 'Abra uma linha, embarque nela e abra 1 estação.',
    why: 'Uma rede precisa de mais de uma linha. Abrir uma nova trilha deixa você construir em paralelo, sem mexer na linha original.',
    actions: ['station', 'line', 'board'],
    steps: [
      {
        label: 'Abrir uma segunda linha',
        done: (s) => !!firstBranchBesidesMain(s),
      },
      {
        label: 'Embarcar o trem na nova linha',
        done: (s) => s.head !== 'main',
      },
      {
        label: 'Abrir 1 estação na nova linha',
        done: (s) => {
          const f = firstBranchBesidesMain(s);
          return !!f && !!f.head && s.commits[f.head]?.branch === f.name;
        },
      },
    ],
    check: (s) => {
      const f = firstBranchBesidesMain(s);
      if (!f || !f.head) return false;
      return s.commits[f.head]?.branch === f.name;
    },
  },
  {
    id: 'merge',
    index: 3,
    eyebrow: 'Nível 03 — Interligação',
    title: 'A Interligação',
    brief:
      'Duas linhas correndo separadas é uma cidade dividida. Traga seu trem de volta à primeira linha e faça a segunda correr para dentro dela — construindo uma interligação onde elas se encontram.',
    task: 'Embarque na primeira linha e convirja a segunda para dentro dela.',
    why: 'Trabalho que vive em linhas separadas precisa se reunir. A interligação junta tudo num ponto só — a rede volta a ser uma cidade inteira.',
    actions: ['station', 'line', 'board', 'converge'],
    steps: [
      {
        label: 'Abrir uma segunda linha',
        done: (s) => !!firstBranchBesidesMain(s),
      },
      {
        label: 'Dar pelo menos uma estação a cada linha',
        done: (s) => {
          const f = firstBranchBesidesMain(s);
          return !!f && !!f.head && Object.keys(s.commits).length >= 2;
        },
      },
      {
        label: 'Embarcar de volta na Linha Central',
        done: (s) => s.head === 'main',
      },
      {
        label: 'Convergir a segunda linha para dentro dela',
        done: (s) => {
          const main = s.branches.main;
          if (!main?.head) return false;
          if (s.commits[main.head]?.isMerge) return true;
          const other = firstBranchBesidesMain(s);
          return !!other && main.head === other.head && Object.keys(s.commits).length > 1;
        },
      },
    ],
    check: (s) => {
      const main = s.branches.main;
      if (!main?.head) return false;
      if (s.commits[main.head]?.isMerge) return true;
      const other = firstBranchBesidesMain(s);
      return other && main.head === other.head && Object.keys(s.commits).length > 1;
    },
  },
];

/* Devolve o primeiro passo ainda não cumprido — usado para a dica
   contextual "o que fazer agora". null = todos os passos prontos. */
export function nextStep(level, state) {
  return level.steps.find((st) => !st.done(state)) ?? null;
}

function firstBranchBesidesMain(s) {
  const name = Object.keys(s.branches).find((b) => b !== 'main');
  return name ? s.branches[name] : null;
}

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}
