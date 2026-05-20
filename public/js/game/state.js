/* ─────────────────────────────────────────────────────────────────────
   The single source of truth: a commit graph.

   - commit  = station   { id, parents[], branch, x, y }
   - branch  = metro line { name, head: commitId, lineIndex }
   - HEAD    = the train  { branch: name }

   The command parser mutates this object; the renderer reads it. State
   flows one way: command → state → render. Nothing else writes here.
   ───────────────────────────────────────────────────────────────────── */

let _seq = 0;
const shortHash = () => (_seq++ + 0xc0ffee).toString(16).slice(0, 7);

export function createState() {
  /* Bootstrap: an empty `main` line. The first commit lays station 1. */
  return {
    commits: {},          // id -> commit
    branches: {           // name -> { name, head, lineIndex }
      main: { name: 'main', head: null, lineIndex: 0 },
    },
    head: 'main',         // name of the branch the train rides
    order: [],            // commit ids in creation order (for layout)
    log: [],              // terminal lines: { kind, text }
  };
}

/* ── Mutations — the only functions allowed to change state ──────────── */

export function commit(state, message) {
  const branch = state.branches[state.head];
  if (!branch) throw new Error(`no line named ${state.head}`);

  const id = shortHash();
  const parent = branch.head;
  state.commits[id] = {
    id,
    parents: parent ? [parent] : [],
    branch: branch.name,
    message: message || 'untitled stop',
  };
  branch.head = id;
  state.order.push(id);
  return id;
}

export function branch(state, name) {
  if (state.branches[name]) throw new Error(`line ${name} already exists`);
  const lineIndex = Object.keys(state.branches).length;
  state.branches[name] = {
    name,
    head: state.branches[state.head].head, // forks from current HEAD
    lineIndex,
  };
}

export function checkout(state, name) {
  if (!state.branches[name]) throw new Error(`no line named ${name}`);
  state.head = name;
}

/* Merge `name` into the current branch. Fast-forward when possible,
   otherwise a real merge commit with two parents (the interchange). */
export function merge(state, name) {
  const target = state.branches[name];
  if (!target) throw new Error(`no line named ${name}`);
  const current = state.branches[state.head];
  if (current.name === name) throw new Error('cannot merge a line into itself');

  if (current.head === target.head) {
    return { kind: 'noop' };
  }

  // Fast-forward: current line has no commits target doesn't already have.
  if (isAncestor(state, current.head, target.head)) {
    current.head = target.head;
    return { kind: 'fast-forward' };
  }

  // Real merge — a station with two parent lines feeding it.
  const id = shortHash();
  state.commits[id] = {
    id,
    parents: [current.head, target.head].filter(Boolean),
    branch: current.name,
    message: `merge ${name}`,
    isMerge: true,
  };
  current.head = id;
  state.order.push(id);
  return { kind: 'merge', id };
}

/* Walk parent links from `descendant` looking for `ancestorId`. */
function isAncestor(state, ancestorId, descendantId) {
  if (!ancestorId) return true;
  const seen = new Set();
  const stack = [descendantId];
  while (stack.length) {
    const id = stack.pop();
    if (id === ancestorId) return true;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const c = state.commits[id];
    if (c) stack.push(...c.parents);
  }
  return false;
}

/* git log — commit chain reachable from HEAD, newest first. */
export function logChain(state) {
  const out = [];
  const seen = new Set();
  const stack = [state.branches[state.head].head];
  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const c = state.commits[id];
    if (c) { out.push(c); stack.push(...c.parents); }
  }
  return out;
}
