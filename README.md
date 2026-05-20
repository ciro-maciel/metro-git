# MetroGit

> Aprenda Git operando uma rede de metrô. Branches são linhas, commits são
> estações, o HEAD é o trem que você conduz.

**MetroGit** é um jogo de navegador, em Canvas, que ensina Git **sem dizer que
está ensinando Git**. Você começa operando um metrô — abrindo linhas, criando
estações, despachando o trem. Em algum momento a ficha cai: cada coisa que você
fez era um comando Git o tempo todo. A revelação vem depois do nível 3.

🎮 **[Jogar agora →](http://metro-git.ciromaciel.click)** — sem cadastro, direto no navegador.

---

## Por que jogar

- **Aprende fazendo, não lendo.** Git é abstrato; um mapa de metrô é concreto.
  Você *vê* a história do projeto crescer como uma rede de trilhos.
- **Sem jargão no começo.** Nada de "commit", "branch", "merge" até você já
  ter feito as três coisas. O vocabulário técnico chega quando já faz sentido.
- **O momento "aha".** A revelação pós-nível-3 conecta cada botão de metrô ao
  comando Git real — é quando o modelo mental trava de vez.
- **Rápido e leve.** Três níveis, jogáveis em minutos. Roda em qualquer
  navegador, sem instalação, sem conta.
- **Acessível.** O canvas é narrado para leitores de tela; toda ação é por
  botão, navegável por teclado.

## Os três níveis

| Nível | Metáfora | O que ensina |
|---|---|---|
| 01 — Partida | Construa a primeira linha | `git commit` — salvar pontos no histórico |
| 02 — Bifurcação | Abra uma segunda linha | `git branch` / `git checkout` — trilhas paralelas |
| 03 — Interligação | Faça as linhas convergirem | `git merge` — juntar o trabalho |

## Stack

Construído com [Bun](https://bun.sh) — runtime, bundler, test runner e gerenciador
de pacotes, tudo num só.

- **Runtime / build:** Bun
- **Servidor:** [Elysia](https://elysiajs.com) sobre `Bun.serve()`
- **Banco:** `bun:sqlite` + [Drizzle ORM](https://orm.drizzle.team) — salva o progresso local
- **Jogo:** Canvas 2D + JavaScript ES6 puro (ESM nativo, sem framework)
- **Design:** sistema "Zen Aesthetics" — monocromático, tipografia Montserrat

## Rodando localmente

Requer [Bun](https://bun.sh) `>= 1.0`.

```sh
bun install     # instala as dependências
bun dev         # sobe em http://localhost:3000 (com --watch)
```

Outros comandos:

```sh
bun start       # produção, sem watch
bun run build   # gera o bundle minificado do jogo
bun test        # roda os testes
```

## Open Source

MetroGit é **open source**, sob a licença [Apache 2.0](./LICENSE) — livre para
usar, estudar, modificar e distribuir. Contribuições, issues e forks são
bem-vindos.

## Autor

Feito por **Ciro Cesar Maciel** — [ciromaciel.click](https://ciromaciel.click/)
