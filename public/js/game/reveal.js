/* ─────────────────────────────────────────────────────────────────────
   The reveal. Fires once, after level 3 clears.

   Up to now the player has been "running a metro". This overlay tells them
   what they were really doing — and maps every metro button they pressed
   to its real Git command, retroactively.
   ───────────────────────────────────────────────────────────────────── */
import { ACTIONS } from './levels.js';
import { icon } from './icons.js';

export function showReveal({ onContinue, counts }) {
  const overlay = document.createElement('div');
  overlay.className = 'reveal';
  overlay.innerHTML = `
    <div class="reveal__card">
      <span class="eyebrow eyebrow--strong">
        ${icon('sparkles', { size: 14 })} Você não estava operando um metrô.
      </span>
      <h2 class="display">Isto era Git<br/>o tempo todo.</h2>
      <p class="reveal__lede">
        Cada linha que você abriu, cada estação que construiu, cada
        interligação que montou — é exatamente assim que pessoas
        desenvolvedoras versionam e juntam código. O mapa que você desenhou
        é um histórico Git.
      </p>

      <div class="reveal__map">
        ${Object.entries(ACTIONS).map(([key, a]) => `
          <div class="reveal__row">
            <span class="reveal__icon">${icon(a.icon, { size: 18 })}</span>
            <span class="reveal__metro">${a.label}</span>
            <span class="reveal__arrow">era</span>
            <code class="reveal__git">${a.git}</code>
          </div>`).join('')}
      </div>

      <div class="reveal__glossary">
        <div><strong>Estação</strong> = um commit — um ponto salvo no histórico</div>
        <div><strong>Linha</strong> = uma branch — uma trilha de trabalho independente</div>
        <div><strong>Seu trem</strong> = o HEAD — onde você está agora</div>
        <div><strong>Interligação</strong> = um merge — duas branches unidas</div>
      </div>

      <p class="reveal__stat">
        Você abriu <strong>${counts.stations}</strong> estações em
        <strong>${counts.lines}</strong> linhas e construiu
        <strong>${counts.merges}</strong> interligaç${counts.merges === 1 ? 'ão' : 'ões'}.
      </p>

      <button class="btn btn--primary" id="reveal-continue">
        Continuar — agora com os nomes reais →
      </button>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('reveal--in'));

  overlay.querySelector('#reveal-continue').addEventListener('click', () => {
    overlay.classList.remove('reveal--in');
    setTimeout(() => { overlay.remove(); onContinue(); }, 260);
  });
}
