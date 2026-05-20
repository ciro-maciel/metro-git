/* ─────────────────────────────────────────────────────────────────────
   Command parser. Takes a raw input string, applies it to the state,
   and returns terminal lines: { kind: 'ok'|'err'|'dim', text }.

   The leading `git` is supplied by the terminal prompt — input is the
   rest, e.g. `commit -m "first stop"`.
   ───────────────────────────────────────────────────────────────────── */
import { commit, branch, checkout, merge, logChain } from './state.js';

/* Pull a -m "message" out of an arg string. */
function parseMessage(rest) {
  const m = rest.match(/-m\s+("([^"]*)"|'([^']*)'|(\S+))/);
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
}

export function runCommand(state, raw) {
  const input = raw.trim().replace(/^git\s+/, ''); // tolerate a typed "git"
  if (!input) return [];

  const [cmd, ...rest] = input.split(/\s+/);
  const argStr = rest.join(' ');

  try {
    switch (cmd) {
      case 'commit': {
        const msg = parseMessage(argStr) || 'untitled stop';
        const id = commit(state, msg);
        return [{ kind: 'ok', text: `[${state.head} ${id}] ${msg}` }];
      }

      case 'branch': {
        if (!rest[0]) {
          return Object.keys(state.branches).map((b) => ({
            kind: 'dim', text: `${b === state.head ? '* ' : '  '}${b}`,
          }));
        }
        branch(state, rest[0]);
        return [{ kind: 'ok', text: `opened line '${rest[0]}'` }];
      }

      case 'checkout': {
        if (!rest[0]) return [{ kind: 'err', text: 'checkout: name a line' }];
        checkout(state, rest[0]);
        return [{ kind: 'ok', text: `boarded line '${rest[0]}'` }];
      }

      case 'merge': {
        if (!rest[0]) return [{ kind: 'err', text: 'merge: name a line' }];
        const res = merge(state, rest[0]);
        if (res.kind === 'noop')
          return [{ kind: 'dim', text: 'Already up to date.' }];
        if (res.kind === 'fast-forward')
          return [{ kind: 'ok', text: `Fast-forward — '${state.head}' caught up to '${rest[0]}'` }];
        return [{ kind: 'ok', text: `Merge made — lines '${state.head}' and '${rest[0]}' converge` }];
      }

      case 'log': {
        const chain = logChain(state);
        if (!chain.length) return [{ kind: 'dim', text: 'no stations yet' }];
        return chain.map((c) => ({
          kind: 'dim', text: `${c.id}  ${c.message}`,
        }));
      }

      case 'status': {
        const head = state.branches[state.head];
        return [{ kind: 'dim', text: `On line '${state.head}' (head ${head.head ?? '—'})` }];
      }

      case 'help':
        return [
          { kind: 'dim', text: 'commit -m "msg"   lay a station' },
          { kind: 'dim', text: 'branch <name>     open a line' },
          { kind: 'dim', text: 'checkout <name>   board a line' },
          { kind: 'dim', text: 'merge <name>      converge lines' },
          { kind: 'dim', text: 'log               look back down the track' },
        ];

      default:
        return [{ kind: 'err', text: `git: '${cmd}' is not a command. Try 'help'.` }];
    }
  } catch (err) {
    return [{ kind: 'err', text: `git ${cmd}: ${err.message}` }];
  }
}
