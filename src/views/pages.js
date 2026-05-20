import { layout } from "./layout.js";

/* O jogo é a página inicial — não há página de marketing nem autenticação.
   Veja playPage abaixo. */

/* ── Superfície do jogo — canvas em tela cheia, UI flutuante, sem login ─ */
export function playPage(progress) {
  const byId = Object.fromEntries((progress ?? []).map((p) => [p.levelId, p]));
  return layout({
    title: "Opere a Rede",
    brand: "Metrô",
    head: `<script type="module" src="/public/js/game/main.js"></script>`,
    body: `
    <!-- O palco é um grid de duas linhas: o mapa em cima ocupando tudo,
         e a barra inferior — que carrega a META à esquerda, os controles
         no centro e a navegação à direita. -->
    <div class="stage">

      <!-- O mapa do metrô ocupa todo o miolo. -->
      <div class="stage__map">
        <!-- Logo — fixo e centralizado no topo. Ícone do Git + "MetroGit"
             + crédito, tudo linkando para o site do autor. -->
        <a class="brand" href="https://ciromaciel.click/" target="_blank" rel="noopener">
          <svg class="brand__mark" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M11 8a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M12 15v-6" />
            <path d="M15 11l-2 -2" />
            <path d="M11 7l-1.9 -1.9" />
            <path d="M13.446 2.6l7.955 7.954a2.045 2.045 0 0 1 0 2.892l-7.955 7.955a2.045 2.045 0 0 1 -2.892 0l-7.955 -7.955a2.045 2.045 0 0 1 0 -2.892l7.955 -7.955a2.045 2.045 0 0 1 2.892 0" />
          </svg>
          <span class="brand__text">
            <strong class="brand__name">MetroGit</strong>
            <span class="brand__by">by Ciro Cesar Maciel</span>
          </span>
        </a>

        <!-- HUD do nível — card flutuante no canto superior-esquerdo. -->
        <header class="hud hud--top">
          <span class="eyebrow eyebrow--strong" id="level-eyebrow">Nível 01 — Partida</span>
          <h1 class="hud__title" id="level-title">Construa a Linha</h1>
        </header>

        <!-- Guia da meta — card fixo no canto superior-direito. -->
        <aside class="guide" id="guide" aria-label="Guia da meta">
          <div class="guide__top">
            <span class="guide__eyebrow"><span id="guide-icon"></span> Sua meta</span>
            <h2 class="guide__task" id="guide-task">Abra 3 estações.</h2>
          </div>

          <div class="guide__progress">
            <div class="guide__progress-bar"><span id="guide-bar"></span></div>
            <span class="guide__progress-label" id="guide-count">0 de 1</span>
          </div>

          <ol class="guide__steps" id="guide-steps"></ol>

          <div class="guide__hint" id="guide-hint">
            <span id="hint-icon"></span>
            <span id="hint-text"></span>
          </div>
        </aside>
        <!-- Marca d'água: o ícone do Git (Tabler brand-git), gigante e
             sutil, ATRÁS do canvas. É a pista escondida — quem conhece o
             logo do Git reconhece antes da revelação. SVG inline para a
             cor vir de currentColor (controlada no CSS). -->
        <svg class="map-watermark" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
          <path d="M11 8a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
          <path d="M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
          <path d="M12 15v-6" />
          <path d="M15 11l-2 -2" />
          <path d="M11 7l-1.9 -1.9" />
          <path d="M13.446 2.6l7.955 7.954a2.045 2.045 0 0 1 0 2.892l-7.955 7.955a2.045 2.045 0 0 1 -2.892 0l-7.955 -7.955a2.045 2.045 0 0 1 0 -2.892l7.955 -7.955a2.045 2.045 0 0 1 2.892 0" />
        </svg>
        <canvas id="metro-canvas" width="1920" height="1080"
                role="img" aria-label="Mapa da rede de metrô"></canvas>
        <p class="sr-only" id="canvas-narration" aria-live="polite"></p>
        <!-- Registro de atividade — flutua sobre o canto do mapa. -->
        <div class="activity" id="activity" aria-live="polite"></div>
      </div>

      <!-- Barra inferior — controles ao centro, navegação à direita. -->
      <footer class="stage__bar">
        <div class="controls" id="controls" role="group" aria-label="Controles do metrô"></div>

        <div class="nav-cluster">
          <span class="hud__progress" id="level-status">Nível 1 de 3</span>
          <button class="btn btn--secondary btn--sm" id="prev-level" disabled>Nível anterior</button>
          <button class="btn btn--primary btn--sm" id="next-level" disabled>Próximo nível</button>
        </div>
      </footer>
    </div>
    <script>
      window.__PROGRESS__ = ${JSON.stringify(byId)};
    </script>`,
  });
}
