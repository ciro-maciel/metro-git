/* ─────────────────────────────────────────────────────────────────────
   Game controller — discovery mode.

   The player operates a metro with buttons. No "Git", no terminal. After
   level 3 clears, the reveal fires once, then the game continues with the
   real names exposed.

   Flow:  button press → Actions mutates state → renderer reads it
          → level check → on clear, advance; after level 3, reveal.
   ───────────────────────────────────────────────────────────────────── */
import { createState } from './state.js';
import { createRenderer } from './render.js';
import { Actions } from './actions.js';
import { LEVELS, ACTIONS, nextStep } from './levels.js';
import { icon } from './icons.js';
import { loadProgress, completeLevel } from './progress.js';
import { showReveal } from './reveal.js';

const canvas = document.getElementById('metro-canvas');
const controlsEl = document.getElementById('controls');
const activityEl = document.getElementById('activity');
const eyebrowEl = document.getElementById('level-eyebrow');
const titleEl = document.getElementById('level-title');
const statusEl = document.getElementById('level-status');
const nextBtn = document.getElementById('next-level');
const prevBtn = document.getElementById('prev-level');
const narrationEl = document.getElementById('canvas-narration');

/* Elementos do guia da meta (faixa na barra inferior). */
const guideTaskEl = document.getElementById('guide-task');
const guideBarEl = document.getElementById('guide-bar');
const guideCountEl = document.getElementById('guide-count');
const guideStepsEl = document.getElementById('guide-steps');
const guideHintEl = document.getElementById('guide-hint');
const hintTextEl = document.getElementById('hint-text');

/* Ícones estáticos da interface, injetados uma vez. */
document.getElementById('guide-icon').innerHTML = icon('target', { size: 13 });
document.getElementById('hint-icon').innerHTML = icon('arrowRight', { size: 14 });
nextBtn.insertAdjacentHTML('beforeend', icon('arrowRight', { size: 15 }));
prevBtn.insertAdjacentHTML('afterbegin', icon('arrowLeft', { size: 15 }));

/* Progresso vem do localStorage — local ao navegador, sem servidor. */
const progress = loadProgress();

let levelIdx = pickStartLevel();
let state = createState();
let cleared = false;
let revealed = false;   // becomes true after the post-level-3 reveal

/* Abre no primeiro nível ainda não concluído. Se a rede inteira já foi
   construída numa sessão anterior, reabre no nível 1 — o jogador revisita
   do começo, com Anterior/Próxima livres para navegar. */
function pickStartLevel() {
  for (let i = 0; i < LEVELS.length; i++) {
    if (progress[LEVELS[i].id]?.status !== 'completed') return i;
  }
  return 0;
}

/* O canvas preenche sua célula do grid (.stage__map). A backing store é
   dimensionada em pixels de dispositivo; o contexto 2D é escalado por DPR
   para que o renderer trabalhe em pixels CSS.

   O canvas agora é uma célula do grid, não a viewport — medimos o próprio
   elemento. Se o layout ainda não correu (rect 0×0), tenta de novo no
   próximo frame em vez de chutar a tela inteira. */
function fitCanvas() {
  const r = canvas.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) {
    requestAnimationFrame(fitCanvas);
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
/* Reajusta em resize — o grid pode ter dado outra largura à célula. */
window.addEventListener('resize', fitCanvas);
/* E observa a própria célula: trocas de layout (guia rolando, etc.)
   redimensionam o canvas sem um resize de janela. */
if (window.ResizeObserver) {
  new ResizeObserver(fitCanvas).observe(canvas.parentElement);
}

const renderer = createRenderer(canvas, () => state, () => revealed);
renderer.start();

/* O canvas é só visual — toda ação vem dos botões. "Embarcar" faz
   rodízio entre as linhas; não há clique nem seleção no mapa. */

loadLevel(levelIdx);

/* ── Level lifecycle ────────────────────────────────────────────────── */
function loadLevel(idx) {
  const level = LEVELS[idx];
  cleared = false;
  state = createState();
  eyebrowEl.textContent = level.eyebrow;
  titleEl.textContent = level.title;
  statusEl.textContent = `Nível ${level.index} de ${LEVELS.length}`;
  nextBtn.disabled = true;
  prevBtn.disabled = idx === 0;   // não há nível anterior ao primeiro
  /* No último nível não há "próxima" — o botão inaugura a rede (e dispara o
     reveal). Reescreve só o nó de texto; o ícone de seta injetado fica. */
  nextBtn.firstChild.nodeValue =
    idx === LEVELS.length - 1 ? 'Inaugurar a rede ' : 'Próximo nível ';
  activityEl.innerHTML = '';
  renderControls(level);
  renderGuide(level);            // preenche o painel de meta
  logActivity({ text: `${level.title} — ${level.task}`, muted: true });
  narrate(`Etapa ${level.index}: ${level.title}. ${level.brief} ${level.task}`);
}

/* ── Guia da meta — passos, progresso e dica, tudo ao vivo ──────────── */
function renderGuide(level) {
  guideTaskEl.textContent = level.task;
  updateGuide(level);
}

/* Recalcula passos/progresso/dica a partir do estado atual. Chamado no
   carregamento do nível e depois de cada ação. */
function updateGuide(level) {
  /* Passos — cada um se marca sozinho lendo o estado. */
  guideStepsEl.innerHTML = '';
  const current = nextStep(level, state);
  level.steps.forEach((step, i) => {
    const done = step.done(state);
    const isCurrent = step === current;
    const li = document.createElement('li');
    li.className = 'guide__step'
      + (done ? ' guide__step--done' : '')
      + (isCurrent ? ' guide__step--current' : '');
    /* Marcador: check quando feito, número quando ainda não. */
    const mark = done
      ? `<span class="guide__step-mark">${icon('check', { size: 13, stroke: 3 })}</span>`
      : (isCurrent
          ? `<span class="guide__step-mark"></span>`
          : `<span class="guide__step-num">${i + 1}</span>`);
    li.innerHTML = `${mark}<span>${step.label}</span>`;
    guideStepsEl.appendChild(li);
  });

  /* Progresso — soma sub-passos com `progress()`, senão conta passos feitos. */
  let cur = 0, total = 0;
  for (const step of level.steps) {
    if (step.progress) {
      const p = step.progress(state);
      cur += p.current; total += p.total;
    } else {
      total += 1;
      if (step.done(state)) cur += 1;
    }
  }
  const pct = total ? Math.round((cur / total) * 100) : 0;
  guideBarEl.style.width = `${pct}%`;
  guideCountEl.textContent = `${cur} de ${total}`;

  /* Dica contextual — o que fazer agora. */
  if (current) {
    hintTextEl.textContent = hintFor(current, level);
    guideHintEl.classList.remove('guide__hint--done');
  } else {
    hintTextEl.textContent = 'Meta concluída — avance para o próximo nível.';
    guideHintEl.classList.add('guide__hint--done');
  }
}

/* Traduz o passo atual numa dica acionável ("Pressione X"). */
function hintFor(step, level) {
  const label = step.label.toLowerCase();
  if (label.includes('estação') || label.includes('estações'))
    return 'Pressione "Nova Estação" para abrir uma parada.';
  if (label.includes('segunda linha') || label.includes('abrir'))
    return 'Pressione "Abrir Linha" para ramificar uma nova linha.';
  if (label.includes('embarcar') && label.includes('central'))
    return 'Pressione "Embarcar" até o trem chegar na Linha Central.';
  if (label.includes('embarcar'))
    return 'Pressione "Embarcar" para o trem ir à próxima linha.';
  if (label.includes('convergir'))
    return 'Pressione "Convergir" para juntar as duas linhas.';
  return step.label;
}

/* Monta os botões de metrô que este nível permite. Cada botão traz
   ícone + rótulo + explicação completa, sempre visível. Pós-revelação,
   ganha também o comando Git real e o que ele faz. */
function renderControls(level) {
  controlsEl.innerHTML = '';
  level.actions.forEach((key, i) => {
    const a = ACTIONS[key];
    const btn = document.createElement('button');
    btn.className = 'control-btn';
    /* Entrada escalonada: cada botão aparece um instante depois do anterior. */
    btn.style.animationDelay = `${i * 60}ms`;
    btn.innerHTML = `
      <span class="control-btn__head">
        <span class="control-btn__icon">${icon(a.icon, { size: 20 })}</span>
        <span class="control-btn__label">${a.label}</span>
      </span>
      <span class="control-btn__hint">${a.hint}</span>
      ${revealed ? `
        <span class="control-btn__git">
          ${icon('arrowRight', { size: 13 })}
          <code>${a.git}</code>
          <span class="control-btn__git-hint">${a.gitHint}</span>
        </span>` : ''}`;
    /* Toda ação dispara direto no clique do botão. "Embarcar" faz rodízio
       entre as linhas — não precisa de alvo. */
    btn.addEventListener('click', () => doAction(key));
    controlsEl.appendChild(btn);
  });
}

function doAction(key) {
  const result = Actions[key](state);
  logActivity(result);
  describeState();
  updateGuide(LEVELS[levelIdx]);   // passos/progresso/dica ao vivo
  checkClear();
}

function checkClear() {
  if (cleared) return;
  const level = LEVELS[levelIdx];
  if (!level.check(state)) return;

  cleared = true;
  logActivity({ text: `${level.title} concluída.`, ok: true });
  narrate(`${level.title} concluída.`);
  nextBtn.disabled = false;

  /* Salva o progresso no localStorage do navegador. */
  completeLevel(level.id, LEVELS.map((l) => l.id));
}

/* ── Registro de atividade — linguagem de metrô (pré-revelação) ─────── */
function logActivity({ text, ok, muted }) {
  const line = document.createElement('div');
  line.className = 'activity__line' +
    (ok ? ' activity__line--ok' : '') +
    (muted ? ' activity__line--dim' : '');
  /* Linhas de sucesso ganham um ícone de check Tabler à esquerda. */
  const glyph = ok ? icon('check', { size: 14 }) : '';
  line.innerHTML = `${glyph}<span>${text}</span>`;
  activityEl.appendChild(line);
  while (activityEl.children.length > 6) activityEl.removeChild(activityEl.firstChild);
}

/* ── Accessibility narration ────────────────────────────────────────── */
function describeState() {
  const lines = Object.keys(state.branches).length;
  const stations = Object.keys(state.commits).length;
  narrate(`Rede: ${lines} linha${lines > 1 ? 's' : ''}, ${stations} estaç${stations !== 1 ? 'ões' : 'ão'}.`);
}
function narrate(text) { if (narrationEl) narrationEl.textContent = text; }

/* ── Advance / the reveal ───────────────────────────────────────────── */
nextBtn.addEventListener('click', () => {
  const lastLevel = levelIdx === LEVELS.length - 1;

  /* The reveal fires once, right after level 3 (the merge) is cleared. */
  if (lastLevel && !revealed) {
    showReveal({
      counts: countNetwork(),
      onContinue: () => {
        revealed = true;
        /* Re-renderiza os controles do nível atual, agora com os rótulos Git. */
        renderControls(LEVELS[levelIdx]);
        logActivity({ text: 'Modo avançado desbloqueado. Os nomes reais estão nos botões agora.', ok: true });
      },
    });
    return;
  }

  if (levelIdx < LEVELS.length - 1) {
    levelIdx++;
    loadLevel(levelIdx);
  } else {
    nextBtn.disabled = true;
    logActivity({ text: 'Rede completa. Três linhas, uma interligação.', ok: true });
  }
});

/* Voltar para o nível anterior — sempre permitido, é só revisão. */
prevBtn.addEventListener('click', () => {
  if (levelIdx > 0) {
    levelIdx--;
    loadLevel(levelIdx);
  }
});

/* Count what the player built — fed into the reveal overlay. */
function countNetwork() {
  return {
    stations: Object.keys(state.commits).length,
    lines: Object.keys(state.branches).length,
    merges: Object.values(state.commits).filter((c) => c.isMerge).length,
  };
}
