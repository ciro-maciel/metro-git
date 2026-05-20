/* Tutorial level definitions — the vertical slice: 3 levels.
   Shared by the server (progress map) and the client (game engine). */
export const LEVELS = [
  {
    id: 'commit',
    index: 1,
    name: 'A Primeira Linha',
    eyebrow: 'Nível 01 — Partida',
    blurb: 'Uma única linha de metrô. Cada commit abre uma nova estação à frente do trem.',
    goal: { commits: 3 },
  },
  {
    id: 'branch',
    index: 2,
    name: 'Trocando de Trilho',
    eyebrow: 'Nível 02 — Bifurcação',
    blurb: 'Uma segunda linha se ramifica da primeira. O trem em que você viaja é o HEAD.',
    goal: { branches: 2, commitsOnBranch: { branch: 'feature', count: 1 } },
  },
  {
    id: 'merge',
    index: 3,
    name: 'As Linhas Convergem',
    eyebrow: 'Nível 03 — Interligação',
    blurb: 'Duas linhas correm para uma plataforma compartilhada. Esse encontro é um merge.',
    goal: { merged: 'feature' },
  },
];

export const LEVEL_IDS = LEVELS.map((l) => l.id);
