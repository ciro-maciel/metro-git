import { test, expect } from 'bun:test';
import { createState } from '../public/js/game/state.js';
import { Actions } from '../public/js/game/actions.js';
import { LEVELS } from '../public/js/game/levels.js';

/* O jogo é dirigido por botões — os testes exercitam a camada Actions,
   o mesmo caminho dos botões do metrô. `board` faz rodízio: cada chamada
   leva o trem para a próxima linha aberta, voltando ao começo no fim. */

test('Nível 1: três "Nova Estação" concluem', () => {
  const s = createState();
  Actions.station(s);
  Actions.station(s);
  expect(LEVELS[0].check(s)).toBe(false);
  Actions.station(s);
  expect(LEVELS[0].check(s)).toBe(true);
  expect(Object.keys(s.commits).length).toBe(3);
});

test('Nível 2: Abrir Linha + Embarcar + Nova Estação concluem', () => {
  const s = createState();
  Actions.station(s);              // uma estação para ramificar
  Actions.line(s);                 // abre uma segunda linha
  expect(LEVELS[1].check(s)).toBe(false); // linha existe, sem estação própria
  Actions.board(s);                // rodízio: main -> Linha Litoral
  Actions.station(s);              // estação própria da nova linha
  expect(LEVELS[1].check(s)).toBe(true);
  expect(s.head).not.toBe('main');
});

test('Nível 3: Convergir constrói uma interligação (merge commit)', () => {
  const s = createState();
  Actions.station(s);
  Actions.line(s);
  Actions.board(s);                // main -> Linha Litoral
  Actions.station(s);              // estação na linha nova
  Actions.board(s);                // rodízio: Linha Litoral -> main
  Actions.station(s);              // main diverge -> força merge real
  const res = Actions.converge(s);
  expect(res.muted).toBeUndefined();
  expect(LEVELS[2].check(s)).toBe(true);
  const head = s.commits[s.branches.main.head];
  expect(head.isMerge).toBe(true);
  expect(head.parents.length).toBe(2);
});

test('Convergir sem divergência faz fast-forward e ainda conclui o N3', () => {
  const s = createState();
  Actions.station(s);
  Actions.line(s);
  Actions.board(s);                // main -> Linha Litoral
  Actions.station(s);
  Actions.board(s);                // Linha Litoral -> main (não moveu)
  const res = Actions.converge(s);
  expect(res.text).toContain('estendida até encontrar');
  expect(LEVELS[2].check(s)).toBe(true);
});

test('board faz rodízio e volta ao começo', () => {
  const s = createState();
  Actions.station(s);
  Actions.line(s);                 // 2 linhas: main, Linha Litoral
  expect(s.head).toBe('main');
  Actions.board(s);                // -> Linha Litoral
  expect(s.head).toBe('Linha Litoral');
  Actions.board(s);                // volta -> main
  expect(s.head).toBe('main');
});

test('as ações nunca vazam a palavra "git" no log', () => {
  const s = createState();
  const lines = [
    Actions.station(s), Actions.line(s), Actions.board(s),
    Actions.station(s),
  ];
  for (const l of lines) {
    expect(l.text.toLowerCase()).not.toContain('git');
    expect(l.text.toLowerCase()).not.toContain('commit');
    expect(l.text.toLowerCase()).not.toContain('branch');
  }
});
