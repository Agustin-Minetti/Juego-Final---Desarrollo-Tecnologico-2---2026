// Comprobador de niveles de Lumo y Umbra (herramienta de desarrollo, no se incluye en el juego).
//
// Simula la física de Arcade de forma aproximada (cuerpo 20×26, gravedad 1200,
// salto −480, velocidad 200, aceleración 2400, salto variable, techos y
// colisión lateral; pozos letales con margen de 2 px, abismo sin margen) y
// resuelve el nivel como un rompecabezas cooperativo abstracto: cada paso es
// "un personaje se mueve a un botón / palanca / puerta / junto a una compuerta"
// o "disuelve un cristal / apaga una barrera", con compuertas abiertas según
// quién pisa qué y el estado de las palancas.
//
// Uso:
//   npm run solve-levels                      → revisa levels/01..08 (normal y conservador) + atajos
//   (--atajos: anula cada botón/palanca, cristal y barrera por separado; si el
//   nivel sigue teniendo solución, ese mecanismo se puede saltear)
//   node scripts/solve-levels.mjs levels/03.json [--jump 455] [--speed 190] [--verbose]
//
// Reporta: si el nivel tiene solución, gemas alcanzables, la secuencia de pasos
// más corta y si cada personaje podría llegar solo a su puerta sin ayuda
// (lumoAlone / umbraAlone): en los niveles cooperativos conviene que sea false.
// No reemplaza la prueba jugando: el modelo es conservador pero aproximado.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const file = args[0] && !args[0].startsWith('--') ? args[0] : undefined;

if (!file) {
  const here = dirname(fileURLToPath(import.meta.url));
  const levelsDir = join(here, '..', 'levels');
  const ids = fs.readdirSync(levelsDir).filter((n) => /^\d{2}\.json$/.test(n)).sort();
  let failed = 0;
  for (const name of ids) {
    const path = join(levelsDir, name);
    const run = (extra) => JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), path, ...extra], { encoding: 'utf8' }));
    const normal = run([]);
    const safe = run(['--jump', '455', '--speed', '190']);
    const ok = normal.solvable && safe.solvable;
    if (!ok) failed++;
    console.log(
      `${name}: ${ok ? 'OK' : 'SIN SOLUCIÓN'} · gemas ${normal.gems} (conservador ${safe.gems}) · ${normal.steps.length} pasos` +
        ` · solo Lumo ${normal.lumoAlone ? 'sí' : 'no'} / solo Umbra ${normal.umbraAlone ? 'sí' : 'no'}`,
    );
    for (const step of normal.steps) console.log(`    - ${step}`);
    if (args.includes('--atajos') || process.argv.includes('--atajos')) {
      // Análisis de atajos: se anula cada mecanismo por separado; si el nivel
      // sigue teniendo solución, ese mecanismo se puede saltear.
      const data = JSON.parse(fs.readFileSync(path, 'utf8'));
      const ids = [...new Set(data.entities.filter((e) => e.type !== 'gate').map((e) => e.id))];
      const cells = (ch) => data.grid.flatMap((row, y) => [...row].map((c, x) => (c === ch ? { x, y } : null))).filter(Boolean);
      const groupsOf = (list) => {
        const out = [];
        const seen = new Set();
        list.forEach((a, i) => {
          if (seen.has(i)) return;
          const g = [i];
          seen.add(i);
          for (let k = 0; k < g.length; k++) {
            list.forEach((b, j) => {
              const c = list[g[k]];
              if (!seen.has(j) && Math.abs(c.x - b.x) + Math.abs(c.y - b.y) === 1) { seen.add(j); g.push(j); }
            });
          }
          g.sort((p, q) => p - q);
          out.push({ key: g.join('-'), at: `(${list[g[0]].x},${list[g[0]].y})` });
        });
        return out;
      };
      const checks = [
        ...ids.map((id) => ({ flag: `switch:${id}`, label: `botones/palancas "${id}"` })),
        ...groupsOf(cells('c')).map((g) => ({ flag: `cristal:${g.key}`, label: `cristal en ${g.at}` })),
        ...groupsOf(cells('b')).map((g) => ({ flag: `barrera:${g.key}`, label: `barrera en ${g.at}` })),
      ];
      for (const c of checks) {
        const r = run(['--disable', c.flag]);
        const isSwitch = c.flag.startsWith('switch:');
        const verdict = r.solvable
          ? isSwitch
            ? 'SE PUEDE SALTEAR'
            : 'no hace falta disolverlo (atajo, o es un puente/piso que no hay que romper)'
          : 'imprescindible';
        console.log(`    · sin ${c.label}: ${verdict}`);
        if (r.solvable && isSwitch) failed++;
      }
    }
  }
  process.exit(failed ? 1 : 0);
}

const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const VERBOSE = args.includes('--verbose');
const JUMP = opt('--jump', 480);
const SPEED = opt('--speed', 200);
const ACC = 2400;
const G = 1200;
const T = 32;
const COLS = 30;
const ROWS = 17;
const BW = 20;
const BH = 26;
const DT = 1 / 60;
const CUT = 0.5;

const level = JSON.parse(fs.readFileSync(file, 'utf8'));
const grid = level.grid;
const at = (tx, ty) => (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS ? '.' : grid[ty][tx]);

// --disable switch:<id> | cristal:<n> | barrera:<n>  (análisis de atajos)
const disabled = [];
for (let i = 0; i < args.length; i++) if (args[i] === '--disable') disabled.push(args[i + 1]);
const offSwitch = new Set(disabled.filter((d) => d.startsWith('switch:')).map((d) => d.slice(7)));
const gates = level.entities.filter((e) => e.type === 'gate');
const buttons = level.entities.filter((e) => e.type === 'button' && !offSwitch.has(e.id));
const levers = level.entities.filter((e) => e.type === 'lever' && !offSwitch.has(e.id));
const leverIds = [...new Set(levers.map((l) => l.id))];
const crystals = [];
const barriers = [];
const gems = [];
let doorL, doorU, spawnL, spawnU;
for (let y = 0; y < ROWS; y++)
  for (let x = 0; x < COLS; x++) {
    const c = at(x, y);
    if (c === 'c') crystals.push({ x, y });
    if (c === 'b') barriers.push({ x, y });
    if (c === 'd') gems.push({ x, y, owner: 'L' });
    if (c === 'v') gems.push({ x, y, owner: 'U' });
    if (c === 'l') doorL = { x, y };
    if (c === 'u') doorU = { x, y };
    if (c === 'L') spawnL = { x, y };
    if (c === 'U') spawnU = { x, y };
  }

function groups(list) {
  const g = list.map((_, i) => i);
  const find = (i) => (g[i] === i ? i : (g[i] = find(g[i])));
  list.forEach((a, i) => list.forEach((b, j) => { if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) g[find(i)] = find(j); }));
  return list.map((_, i) => list.map((_, j) => j).filter((j) => find(j) === find(i)));
}
const groupC = groups(crystals);
const groupB = groups(barriers);
const groupKey = (g) => g.join('-');
const offC = new Set(disabled.filter((d) => d.startsWith('cristal:')).map((d) => d.slice(8)));
const offB = new Set(disabled.filter((d) => d.startsWith('barrera:')).map((d) => d.slice(8)));
// config: { who, openGates:Set<idx>, goneC:Set, goneB:Set }
function solidAt(tx, ty, cfg) {
  const c = at(tx, ty);
  if (c === '#' || c === 'p' || c === 's' || c === 'l' || c === 'u') return true;
  if (c === 'c') {
    const i = crystals.findIndex((k) => k.x === tx && k.y === ty);
    return !cfg.goneC.has(i);
  }
  if (c === 'b') {
    const i = barriers.findIndex((k) => k.x === tx && k.y === ty);
    return !cfg.goneB.has(i);
  }
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    if (g.x === tx && g.y === ty && !cfg.openGates.has(i)) return true;
  }
  return false;
}

function overlapsSolid(x, y, cfg) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + BW - 1e-6) / T);
  const y0 = Math.floor(y / T), y1 = Math.floor((y + BH - 1e-6) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty, cfg)) return { tx, ty };
  return null;
}

function lethal(x, y, who) {
  // pozos con margen 2, abismo margen 0
  const m = 2;
  const x0 = Math.floor((x - m) / T), x1 = Math.floor((x + BW + m - 1e-3) / T);
  const y0 = Math.floor((y - m) / T), y1 = Math.floor((y + BH + m - 1e-3) / T);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      const c = at(tx, ty);
      if (c === 'p' && who === 'U') return true;
      if (c === 's' && who === 'L') return true;
    }
  const a0 = Math.floor(x / T), a1 = Math.floor((x + BW - 1e-3) / T);
  const b0 = Math.floor(y / T), b1 = Math.floor((y + BH - 1e-3) / T);
  for (let ty = b0; ty <= b1; ty++) for (let tx = a0; tx <= a1; tx++) if (at(tx, ty) === 'a') return true;
  return false;
}

function touchedItems(x, y, cfg, out) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + BW - 1e-3) / T);
  const y0 = Math.floor(y / T), y1 = Math.floor((y + BH - 1e-3) / T);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      gems.forEach((g, i) => {
        if (g.x === tx && g.y === ty && g.owner === cfg.who) out.gems.add(i);
      });
    }
  // contacto (bordes incluidos, +1px) con cristal/barrera propios: se registra y aborta
  const e = 1;
  const c0 = Math.floor((x - e) / T), c1 = Math.floor((x + BW + e - 1e-3) / T);
  const d0 = Math.floor((y - e) / T), d1 = Math.floor((y + BH + e - 1e-3) / T);
  let hit = false;
  for (let ty = d0; ty <= d1; ty++)
    for (let tx = c0; tx <= c1; tx++) {
      if (cfg.who === 'L') crystals.forEach((k, i) => { if (k.x === tx && k.y === ty && !cfg.goneC.has(i)) { out.c.add(i); hit = true; } });
      if (cfg.who === 'U') barriers.forEach((k, i) => { if (k.x === tx && k.y === ty && !cfg.goneB.has(i)) { out.b.add(i); hit = true; } });
    }
  return hit;
}

// Simula una acción. plan(frame) -> {d, holdJump}
function simulate(x, y, cfg, jump, plan, out) {
  let vx = 0;
  let vy = jump ? -JUMP : 0;
  let holding = jump;
  for (let f = 0; f < 240; f++) {
    const p = plan(f);
    if (holding && !p.hold) {
      holding = false;
      if (vy < 0) vy *= CUT;
    }
    if (p.d !== 0) {
      vx += p.d * ACC * DT;
      if (vx > SPEED) vx = SPEED;
      if (vx < -SPEED) vx = -SPEED;
    } else {
      const dec = ACC * DT;
      vx = Math.abs(vx) <= dec ? 0 : vx - Math.sign(vx) * dec;
    }
    vy += G * DT;
    // X (borde de avance)
    let nx = x + vx * DT;
    if (nx < 0) { nx = 0; vx = 0; }
    if (nx > COLS * T - BW) { nx = COLS * T - BW; vx = 0; }
    {
      const ty0 = Math.floor(y / T), ty1 = Math.floor((y + BH - 1e-6) / T);
      if (vx > 0) {
        const tx = Math.floor((nx + BW - 1e-6) / T);
        for (let ty = ty0; ty <= ty1; ty++) if (solidAt(tx, ty, cfg)) { nx = tx * T - BW; vx = 0; break; }
      } else if (vx < 0) {
        const tx = Math.floor(nx / T);
        for (let ty = ty0; ty <= ty1; ty++) if (solidAt(tx, ty, cfg)) { nx = (tx + 1) * T; vx = 0; break; }
      }
    }
    x = nx;
    // Y (borde de avance)
    let ny = y + vy * DT;
    let grounded = false;
    if (ny < 0) { ny = 0; vy = 0; }
    {
      const tx0 = Math.floor(x / T), tx1 = Math.floor((x + BW - 1e-6) / T);
      if (vy > 0) {
        const ty = Math.floor((ny + BH - 1e-6) / T);
        for (let tx = tx0; tx <= tx1; tx++) if (solidAt(tx, ty, cfg)) { ny = ty * T - BH; vy = 0; grounded = true; break; }
      } else if (vy < 0) {
        const ty = Math.floor(ny / T);
        for (let tx = tx0; tx <= tx1; tx++) if (solidAt(tx, ty, cfg)) { ny = (ty + 1) * T; vy = 0; break; }
      }
    }
    if (ny + BH >= ROWS * T) { ny = ROWS * T - BH; vy = 0; grounded = true; }
    y = ny;
    if (lethal(x, y, cfg.who)) return null;
    if (touchedItems(x, y, cfg, out)) return null;
    if (grounded && f > 2 && vx === 0 && p.d === 0) {
      return { x, y };
    }
    if (grounded && f > 2 && p.final) {
      // tocó suelo: dejar que frene
    }
  }
  return null;
}

// Los nodos se agrupan en celdas de 6 px, pero se guarda la posición exacta del
// primer cuerpo que llegó (así nunca se expande desde una posición incrustada en un muro).
const exactPos = new Map();
const nodeKey = (x, y) => {
  const k = `${Math.round(x / 6) * 6},${Math.round(y)}`;
  if (!exactPos.has(k)) exactPos.set(k, [x, y]);
  return k;
};
const parseKey = (k) => exactPos.get(k) ?? k.split(',').map(Number);

function makePlans() {
  const plans = [];
  // caminatas / caídas
  for (const d of [-1, 1])
    for (const k of [3, 6, 12, 24, 48])
      for (const d2 of [0, d, -d]) plans.push({ jump: false, plan: (f) => ({ d: f < k ? d : (f < k + 40 ? d2 : 0), hold: false }) });
  // saltos
  for (const pre of [0, 6])
    for (const hold of [999, 8])
      for (const t1 of [0, 10, 24])
        for (const d1 of [-1, 0, 1])
          for (const d2 of [-1, 0, 1]) {
            if (t1 === 0 && d1 !== 0) continue;
            plans.push({
              jump: true,
              pre,
              plan: (f) => {
                const air = f;
                let d = air < t1 ? d1 : d2;
                if (air > 70) d = 0;
                return { d, hold: air < hold };
              },
            });
          }
  return plans;
}
const PLANS = makePlans();

const edgeCache = new Map();
const floodCache = new Map();
function expand(who, k, c, edges) {
  if (edges.has(k)) return edges.get(k);
  let [x, y] = parseKey(k);
  const out = { gems: new Set(), c: new Set(), b: new Set() };
  const succ = new Set();
  // Si el cuerpo quedó dentro de un sólido (p. ej. parado en el hueco de una
  // compuerta que después se cerró), Arcade lo empuja hacia el costado libre
  // más cercano: se hace lo mismo antes de expandir, para no "atravesar" muros.
  if (overlapsSolid(x, y, c)) {
    let fixed = false;
    for (let d = 1; d <= BW + 2 && !fixed; d++) {
      for (const nx of [x - d, x + d]) {
        if (!overlapsSolid(nx, y, c)) { x = nx; fixed = true; break; }
      }
    }
    if (!fixed) {
      const e = { succ, ...out };
      edges.set(k, e);
      return e;
    }
  }
  for (const p of PLANS) {
    let sx = x, sy = y;
    if (p.jump && p.pre) {
      const dir = p.plan(30).d || p.plan(0).d;
      if (!dir) continue;
      let vx = 0;
      let ok = true;
      for (let f = 0; f < p.pre; f++) {
        vx = Math.max(-SPEED, Math.min(SPEED, vx + dir * ACC * DT));
        const nx = sx + vx * DT;
        if (overlapsSolid(nx, sy, c) || !overlapsSolid(nx, sy + 1, c) || lethal(nx, sy, who)) { ok = false; break; }
        sx = nx;
      }
      if (!ok) continue;
    }
    const r = simulate(sx, sy, c, p.jump, p.plan, out);
    if (!r) continue;
    succ.add(nodeKey(r.x, r.y));
  }
  const e = { succ, ...out };
  edges.set(k, e);
  return e;
}
function flood(who, startKey, cfg) {
  const cfgKey = `${who}|${[...cfg.openGates].sort()}|${[...cfg.goneC].sort()}|${[...cfg.goneB].sort()}`;
  const ck = `${cfgKey}|${startKey}`;
  if (floodCache.has(ck)) return floodCache.get(ck);
  if (!edgeCache.has(cfgKey)) edgeCache.set(cfgKey, new Map());
  const edges = edgeCache.get(cfgKey);
  const c = { ...cfg, who };
  const seen = new Set([startKey]);
  const queue = [startKey];
  const out = { gems: new Set(), c: new Set(), b: new Set() };
  while (queue.length) {
    const k = queue.pop();
    const e = expand(who, k, c, edges);
    e.gems.forEach((g) => out.gems.add(g));
    e.c.forEach((g) => out.c.add(g));
    e.b.forEach((g) => out.b.add(g));
    for (const nk of e.succ) if (!seen.has(nk)) { seen.add(nk); queue.push(nk); }
  }
  const res = { nodes: seen, ...out };
  floodCache.set(ck, res);
  return res;
}

// nodo "de pie" sobre la cara superior de un tile (tx, ty)
function standsOn(key, tx, ty) {
  const [x, y] = parseKey(key);
  return Math.abs(y + BH - ty * T) < 0.5 && x + BW > tx * T && x < (tx + 1) * T;
}

function spawnKey(s, who) {
  // caer desde el spawn
  const out = { gems: new Set(), c: new Set(), b: new Set() };
  const cfg = { who, openGates: new Set(), goneC: new Set(), goneB: new Set() };
  const r = simulate(s.x * T + (T - BW) / 2, s.y * T + T / 2 - BH / 2, cfg, false, () => ({ d: 0 }), out);
  return nodeKey(r.x, r.y);
}

const sL = process.env.SL || spawnKey(spawnL, 'L');
const sU = process.env.SU || spawnKey(spawnU, 'U');

function openGatesFor(otherKey, leverBits) {
  const open = new Set();
  gates.forEach((g, i) => {
    const byButton = buttons.some((b) => b.id === g.id && standsOn(otherKey, b.x, b.y));
    const li = leverIds.indexOf(g.id);
    const byLever = li >= 0 && (leverBits >> li) & 1;
    if (byButton || byLever) open.add(i);
  });
  return open;
}

function keyNodes(nodes) {
  const out = [];
  for (const k of nodes) {
    let tag = null;
    for (const b of buttons) if (standsOn(k, b.x, b.y)) tag = `btn:${b.id}@${b.x}`;
    for (const l of levers) if (standsOn(k, l.x, l.y)) tag = `lever:${l.id}@${l.x}`;
    if (!tag) {
      const [x, y] = parseKey(k);
      const cx = Math.floor((x + BW / 2) / T), row = (y + BH) / T;
      gates.forEach((g, i) => {
        const dx = cx - g.x;
        if (Math.abs(dx) >= 1 && Math.abs(dx) <= 2 && Math.abs(row - (g.y + 1)) <= 1) tag = `cerca:${g.id}@${g.x},${g.y}:${dx < 0 ? 'izq' : 'der'}`;
      });
    }
    if (standsOn(k, doorL.x, doorL.y)) tag = 'doorL';
    if (standsOn(k, doorU.x, doorU.y)) tag = 'doorU';
    if (tag) out.push({ k, tag });
  }
  // un representante por tag
  const seen = new Map();
  for (const o of out) if (!seen.has(o.tag)) seen.set(o.tag, o);
  return [...seen.values()];
}

const bits = (s) => [...s].reduce((a, i) => a | (1 << i), 0);
const fromBits = (n) => { const s = new Set(); for (let i = 0; i < 31; i++) if ((n >> i) & 1) s.add(i); return s; };

// BFS abstracto
const start = { L: sL, U: sU, lev: 0, gc: 0, gb: 0 };
const sk = (s) => `${s.L}|${s.U}|${s.lev}|${s.gc}|${s.gb}`;
const prev = new Map([[sk(start), null]]);
const q = [start];
const gemsGot = new Set();
let goal = null;
let explored = 0;
while (q.length && !goal) {
  const s = q.shift();
  explored++;
  for (const who of ['L', 'U']) {
    const me = s[who];
    const other = who === 'L' ? s.U : s.L;
    const gc = fromBits(s.gc), gb = fromBits(s.gb);
    const fl = flood(who, me, { openGates: openGatesFor(other, s.lev), goneC: gc, goneB: gb });
    fl.gems.forEach((g) => gemsGot.add(g));
    for (const i of who === 'L' ? fl.c : fl.b) {
      if ((who === 'L' ? offC : offB).has(groupKey((who === 'L' ? groupC : groupB)[i]))) continue;
      const grp = (who === 'L' ? groupC : groupB)[i].reduce((a, j) => a | (1 << j), 0);
      const ns = who === 'L' ? { ...s, gc: s.gc | grp } : { ...s, gb: s.gb | grp };
      const key = sk(ns);
      if (prev.has(key)) continue;
      prev.set(key, { from: sk(s), move: `${who === 'L' ? 'Lumo disuelve cristal' : 'Umbra apaga barrera'} ${i}` });
      q.push(ns);
    }
    for (const { k, tag } of keyNodes(fl.nodes)) {
      let lev = s.lev;
      if (tag.startsWith('lever:')) {
        const id = tag.slice(6).split('@')[0];
        lev ^= 1 << leverIds.indexOf(id);
      }
      const ns = { ...s, [who]: k, lev, gc: bits(gc), gb: bits(gb) };
      const key = sk(ns);
      if (prev.has(key)) continue;
      prev.set(key, { from: sk(s), move: `${who === 'L' ? 'Lumo' : 'Umbra'} -> ${tag}` });
      if (standsOn(ns.L, doorL.x, doorL.y) && standsOn(ns.U, doorU.x, doorU.y)) { goal = key; break; }
      q.push(ns);
    }
    if (goal) break;
  }
}

const result = { file, jump: JUMP, solvable: !!goal, explored, gems: `${gemsGot.size}/${gems.length}`, steps: [] };
if (goal) {
  let k = goal;
  while (prev.get(k)) { result.steps.unshift(prev.get(k).move); k = prev.get(k).from; }
}
const missing = gems.filter((_, i) => !gemsGot.has(i)).map((g) => `${g.owner}@${g.x},${g.y}`);
if (missing.length) result.missingGems = missing;
// alcanzabilidad individual desde el spawn sin ayuda (para diagnóstico)
if (VERBOSE) result.trace = [...prev.entries()].filter(([, v]) => v).map(([k, v]) => `${v.move}  => ${k}`);
if (VERBOSE || !goal) {
  const solo = (who, s) => flood(who, s, { openGates: new Set(), goneC: new Set(), goneB: new Set() }).nodes;
  const desc = (nodes) => {
    const ys = {};
    for (const k of nodes) { const [x, y] = parseKey(k); const row = (y + BH) / T; (ys[row] ??= []).push(Math.floor((x + BW / 2) / T)); }
    return Object.entries(ys).map(([r, xs]) => `fila ${r}: cols ${Math.min(...xs)}-${Math.max(...xs)}`).join('; ');
  };
  result.soloL = desc(solo('L', sL));
  result.soloU = desc(solo('U', sU));
}
{
  const none = { openGates: new Set(), goneC: new Set(), goneB: new Set() };
  const fl = flood('L', sL, none), fu = flood('U', sU, none);
  result.lumoAlone = [...fl.nodes].some((k) => standsOn(k, doorL.x, doorL.y));
  result.umbraAlone = [...fu.nodes].some((k) => standsOn(k, doorU.x, doorU.y));
}
console.log(JSON.stringify(result));
