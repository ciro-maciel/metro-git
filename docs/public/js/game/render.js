/* ─────────────────────────────────────────────────────────────────────
   Canvas renderer + game loop. Reads state, draws a metro map:
   lines as tracks, commits as stations, HEAD as a moving train.

   Palette is the RiLiGar monochrome set — color is status only.

   Animation: the renderer keeps its own timing map (anim) keyed by commit
   id, separate from the pure graph in `state`. State stays a clean data
   structure; all visual easing lives here.
   ───────────────────────────────────────────────────────────────────── */

const INK = '#34322D';        // brand black
const TRACK = '#D1D5DB';      // gray-3
const STATION = '#FFFFFF';
const MUTED = '#9CA3AF';      // gray-4
const SOFT = '#F8F8F8';       // gray-0
const TRAIN = '#34322D';
const LIVE = '#51CF66';       // green — status

/* Lines get distinct ink shades, never hues — the network stays monochrome. */
const LINE_INK = ['#34322D', '#6B7280', '#1F2937', '#4B5563'];

const COL_GAP = 150;          // horizontal spacing between stations
const ROW_GAP = 120;          // vertical spacing between lines
const STATION_R = 18;

/* O canvas preenche a viewport inteira; o HUD do título flutua no topo e
   a barra fixa ocupa o rodapé. Estas folgas mantêm a cena (estações,
   trilhos) na faixa livre entre eles. */
const SAFE_TOP = 130;
const SAFE_BOTTOM = 200;

/* Animation durations (ms). */
const STATION_POP = 420;      // station scales 0 -> 1
const TRACK_DRAW = 380;       // track grows from parent toward child

/* Easing — RiLiGar's bento curve, restrained. */
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

/* Layout: assign each commit an (x, y), then center the network in the
   canvas's free band so it never hides under the HUD or controls. */
function layout(state, w, h) {
  const depth = {};
  let maxDepth = 0, maxRow = 0;
  for (const id of state.order) {
    const c = state.commits[id];
    const parentDepths = c.parents.map((p) => depth[p] ?? -1);
    depth[id] = (parentDepths.length ? Math.max(...parentDepths) : -1) + 1;
    maxDepth = Math.max(maxDepth, depth[id]);
    maxRow = Math.max(maxRow, state.branches[c.branch]?.lineIndex ?? 0);
  }
  const netW = maxDepth * COL_GAP;
  const netH = maxRow * ROW_GAP;
  const bandH = h - SAFE_TOP - SAFE_BOTTOM;
  const originX = Math.max(140, (w - netW) / 2);
  const originY = SAFE_TOP + Math.max(0, (bandH - netH) / 2);

  const pos = {};
  for (const id of state.order) {
    const c = state.commits[id];
    const row = state.branches[c.branch]?.lineIndex ?? 0;
    pos[id] = {
      x: originX + depth[id] * COL_GAP,
      y: originY + row * ROW_GAP,
    };
  }
  return { pos, originX, originY };
}

export function createRenderer(canvas, getState, isRevealed = () => true) {
  const ctx = canvas.getContext('2d');
  let train = null;            // animated train position
  let raf = null;
  /* Per-commit animation timing — birth timestamps, keyed by id. */
  const anim = new Map();
  /* Per-station passengers — small orbiting dots, decorative. */
  const passengers = new Map();

  /* Register newly-appeared commits so their pop/track animations start. */
  function syncAnim(state) {
    const now = performance.now();
    for (const id of state.order) {
      if (!anim.has(id)) {
        anim.set(id, now);
        /* 2–4 passengers per station, random orbit phase + speed. */
        const n = 2 + Math.floor(Math.random() * 3);
        passengers.set(id, Array.from({ length: n }, () => ({
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.4,
          radius: STATION_R + 10 + Math.random() * 8,
        })));
      }
    }
    /* Drop animation entries for commits that no longer exist (level reset). */
    for (const id of [...anim.keys()]) {
      if (!state.commits[id]) { anim.delete(id); passengers.delete(id); }
    }
  }

  function frame() {
    const state = getState();
    syncAnim(state);
    const now = performance.now();

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const { pos, originX, originY } = layout(state, w, h);
    if (!train) train = { x: originX, y: originY };

    /* O canvas é transparente: só limpa. O fundo (gray-0) e a marca
       d'água do trem vêm de camadas DOM atrás dele — ver .stage__map
       e .map-watermark no CSS. */
    ctx.clearRect(0, 0, w, h);

    /* ── Tracks — drawn progressively from parent toward child ───────── */
    for (const id of state.order) {
      const c = state.commits[id];
      const p = pos[id];
      const lineIdx = state.branches[c.branch]?.lineIndex ?? 0;
      const grow = clamp01((now - (anim.get(id) ?? now)) / TRACK_DRAW);
      const ease = easeOut(grow);
      for (const parentId of c.parents) {
        const pp = pos[parentId];
        if (!pp) continue;
        /* Build the orthogonal "metro" path as points, then draw a
           fraction of its total length so the track visibly extends. */
        const pts = [{ x: pp.x, y: pp.y }];
        if (pp.y !== p.y) {
          pts.push({ x: p.x - COL_GAP / 2, y: pp.y });
          pts.push({ x: p.x - COL_GAP / 2, y: p.y });
        }
        pts.push({ x: p.x, y: p.y });
        drawPartialPath(ctx, pts, ease);
        ctx.strokeStyle = c.isMerge ? INK : LINE_INK[lineIdx % LINE_INK.length];
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    /* ── Stations — pop in with a scale ease ─────────────────────────── */
    for (const id of state.order) {
      const c = state.commits[id];
      const p = pos[id];
      const age = now - (anim.get(id) ?? now);
      const pop = easeOut(clamp01(age / STATION_POP));
      /* Tracks finish first, then the station pops — slight delay. */
      const popDelayed = easeOut(clamp01((age - TRACK_DRAW * 0.5) / STATION_POP));
      const r = STATION_R * popDelayed;
      if (r < 0.5) continue;

      /* Passengers orbit the station — drawn behind the platform. */
      drawPassengers(ctx, p, passengers.get(id), now, popDelayed);

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = STATION;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();

      /* Labels fade in only once the station has mostly popped. */
      const textAlpha = clamp01((popDelayed - 0.6) / 0.4);
      if (textAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = textAlpha;
        if (isRevealed()) {
          ctx.fillStyle = MUTED;
          ctx.font = '600 13px Montserrat, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(c.id, p.x, p.y + STATION_R + 20);
        }
        ctx.fillStyle = INK;
        ctx.font = '700 13px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        const label = isRevealed()
          ? c.message
          : (c.isMerge ? 'Interligação' : `Estação ${depthLabel(state, id)}`);
        ctx.fillText(trim(label, 18), p.x, p.y - STATION_R - 12);
        ctx.restore();
      }
    }

    /* ── Line labels — pinned à esquerda da primeira estação de cada linha.
       Só rótulos: a linha onde o trem está fica em tinta cheia, as demais
       em cinza. Embarcar é por botão (rodízio), não por clique no mapa. */
    ctx.font = '800 12px Montserrat, sans-serif';
    ctx.textAlign = 'right';
    for (const name of Object.keys(state.branches)) {
      const b = state.branches[name];
      const y = originY + b.lineIndex * ROW_GAP;
      const isHead = name === state.head;
      const shown = (!isRevealed() && name === 'main') ? 'Linha Central' : name;
      ctx.fillStyle = isHead ? INK : MUTED;
      ctx.fillText(shown.toUpperCase(), originX - 28, y + 4);
    }

    /* ── Empty-state hint — below the resting train ──────────────────── */
    if (state.order.length === 0) {
      ctx.fillStyle = MUTED;
      ctx.font = '600 15px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pressione "Nova Estação" para abrir a primeira parada à frente do trem',
        originX, originY + 64);
    }

    /* ── The train rides HEAD — glides visibly along the track ───────── */
    const headId = state.branches[state.head]?.head;
    const target = headId ? pos[headId] : { x: originX, y: originY };
    /* Slower lerp = the journey reads as travel, not teleport. */
    train.x += (target.x - train.x) * 0.08;
    train.y += (target.y - train.y) * 0.08;
    const moving = Math.hypot(target.x - train.x, target.y - train.y) > 1.5;
    drawTrain(ctx, train.x, train.y, moving);

    raf = requestAnimationFrame(frame);
  }

  /* Draw `frac` (0..1) of a multi-segment polyline as a single path. */
  function drawPartialPath(ctx, pts, frac) {
    let total = 0;
    const segLen = [];
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segLen.push(d);
      total += d;
    }
    let budget = total * frac;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const d = segLen[i - 1];
      if (budget >= d) {
        ctx.lineTo(pts[i].x, pts[i].y);
        budget -= d;
      } else {
        const t = d === 0 ? 0 : budget / d;
        ctx.lineTo(
          pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
          pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
        );
        break;
      }
    }
  }

  /* Passengers — tiny dots orbiting a station, fading in with it. */
  function drawPassengers(ctx, p, list, now, alpha) {
    if (!list || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = MUTED;
    const t = now / 1000;
    for (const pax of list) {
      const a = pax.phase + t * pax.speed;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * pax.radius,
              p.y + Math.sin(a) * pax.radius, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrain(ctx, x, y, moving) {
    const t = Date.now() / 1000;
    /* Pulse while parked; settle while moving so motion reads cleanly. */
    const pulse = moving ? 1 : 1 + Math.sin(t * 3) * 0.06;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    rounded(ctx, -16, -16, 32, 32, 8);
    ctx.fillStyle = TRAIN;
    ctx.fill();
    /* Live dot — the only color: the train is "you are here". */
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = LIVE;
    ctx.fill();
    ctx.restore();
  }

  function start() { if (!raf) frame(); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  return { start, stop };
}

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function trim(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

/* 1-based position of a commit along its line — used for "Estação N"
   labels before the reveal, when real commit messages stay hidden. */
function depthLabel(state, id) {
  const c = state.commits[id];
  let n = 1, cur = c;
  while (cur && cur.parents[0]) {
    const parent = state.commits[cur.parents[0]];
    if (parent && parent.branch === c.branch) n++;
    cur = parent;
  }
  return n;
}
