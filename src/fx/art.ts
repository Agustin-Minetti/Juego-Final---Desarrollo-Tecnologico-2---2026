/**
 * Arte del juego dibujado por código con Canvas 2D (DESIGN → Estética).
 *
 * Cada función recibe un contexto 2D ya dimensionado y dibuja una textura.
 * BootScene las vuelca a texturas de Phaser con `textures.createCanvas`.
 *
 * Lenguaje visual (pensado para que se entienda qué es cada cosa):
 * - Todo lo que Lumo puede tocar sin peligro (o romper) lleva un **sol**.
 * - Todo lo que Umbra puede tocar sin peligro (o apagar) lleva una **luna**.
 * - Luz = dorado brillante y cálido; sombra = violeta oscuro con humo.
 * - Las piezas de mecanismo (botones, palancas, compuertas) se dibujan en
 *   grises claros y se tiñen con el color de su ID.
 */

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

export const ART_COLORS = {
  skyTop: '#120e20',
  skyMid: '#2a1d3c',
  skyLow: '#4a2745',
  skyHorizon: '#7a3a4c',
  sun: '#f4a259',
  ruinFar: '#21182f',
  ruinNear: '#18111f',
  stone: '#4a4068',
  stoneDark: '#2a2340',
  stoneLight: '#4a4066',
  stoneLip: '#b5a0d6',
  moss: '#6f8f6a',
  light: '#ffe08a',
  lightDeep: '#f0a030',
  lightPale: '#fff6cf',
  shadow: '#4b2d73',
  shadowDeep: '#1a0d2e',
  shadowRim: '#b48cff',
  lumo: '#ffd166',
  lumoCore: '#fff7da',
  lumoEdge: '#c9842a',
  umbra: '#5b3a96',
  umbraDeep: '#24123f',
  umbraOutline: '#c9a6ff',
  umbraEyes: '#f4ecff',
  abyss: '#07050d',
} as const;

/** Pseudoaleatorio determinista (mismo dibujo en cada carga). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function vGradient(ctx: Ctx, y0: number, y1: number, stops: ReadonlyArray<readonly [number, string]>): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) {
    g.addColorStop(at, color);
  }
  return g;
}

function radial(ctx: Ctx, x: number, y: number, r: number, stops: ReadonlyArray<readonly [number, string]>): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [at, color] of stops) {
    g.addColorStop(at, color);
  }
  return g;
}

// ---------------------------------------------------------------- iconos

/** Sol: disco con rayos. Marca lo que Lumo puede tocar. */
export function drawSunIcon(ctx: Ctx, cx: number, cy: number, r: number, color: string, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.28);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.48, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

/** Luna creciente. Marca lo que Umbra puede tocar. */
export function drawMoonIcon(ctx: Ctx, cx: number, cy: number, r: number, color: string, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.arc(cx + r * 0.45, cy - r * 0.3, r * 0.82, 0, TAU, true);
  ctx.fill('evenodd');
  ctx.restore();
}

export function drawSunBadge(ctx: Ctx, size: number): void {
  const c = size / 2;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, 'rgba(255,240,190,0.9)'],
    [0.6, 'rgba(255,209,102,0.35)'],
    [1, 'rgba(255,209,102,0)'],
  ]);
  ctx.fillRect(0, 0, size, size);
  drawSunIcon(ctx, c, c, size * 0.36, '#fff3c4');
  drawSunIcon(ctx, c, c, size * 0.2, '#f0a030');
}

export function drawMoonBadge(ctx: Ctx, size: number): void {
  const c = size / 2;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, 'rgba(230,214,255,0.8)'],
    [0.6, 'rgba(180,140,255,0.3)'],
    [1, 'rgba(180,140,255,0)'],
  ]);
  ctx.fillRect(0, 0, size, size);
  drawMoonIcon(ctx, c, c, size * 0.32, '#efe4ff');
}

// ---------------------------------------------------------------- fondo

/** Cielo de atardecer con ruinas lejanas (960 × 544). */
export function drawBackground(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = vGradient(ctx, 0, h, [
    [0, ART_COLORS.skyTop],
    [0.5, ART_COLORS.skyMid],
    [0.82, ART_COLORS.skyLow],
    [1, ART_COLORS.skyHorizon],
  ]);
  ctx.fillRect(0, 0, w, h);

  const rand = rng(7);
  for (let i = 0; i < 90; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.55;
    const a = 0.15 + rand() * 0.5 * (1 - y / (h * 0.55));
    ctx.fillStyle = `rgba(255,240,220,${a.toFixed(3)})`;
    ctx.fillRect(x, y, rand() < 0.15 ? 2 : 1, rand() < 0.15 ? 2 : 1);
  }

  // sol bajo
  const sx = w * 0.72;
  const sy = h * 0.9;
  ctx.fillStyle = radial(ctx, sx, sy, 260, [
    [0, 'rgba(244,162,89,0.45)'],
    [0.35, 'rgba(244,162,89,0.16)'],
    [1, 'rgba(244,162,89,0)'],
  ]);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(250,190,120,0.35)';
  ctx.beginPath();
  ctx.arc(sx, sy, 70, 0, TAU);
  ctx.fill();

  // ruinas lejanas: columnas y arcos
  ctx.globalAlpha = 0.7;
  drawRuins(ctx, w, h, ART_COLORS.ruinFar, h * 0.62, 0.9, 11);
  ctx.globalAlpha = 0.85;
  drawRuins(ctx, w, h, ART_COLORS.ruinNear, h * 0.74, 1.25, 23);
  ctx.globalAlpha = 1;

  // bruma
  ctx.fillStyle = vGradient(ctx, h * 0.6, h, [
    [0, 'rgba(120,70,110,0)'],
    [1, 'rgba(120,70,110,0.25)'],
  ]);
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
}

function drawRuins(ctx: Ctx, w: number, h: number, color: string, base: number, scale: number, seed: number): void {
  const rand = rng(seed);
  ctx.fillStyle = color;
  ctx.fillRect(0, base, w, h - base);
  let x = -20;
  while (x < w + 40) {
    const kind = rand();
    const colW = 14 * scale;
    if (kind < 0.45) {
      // arco con dos columnas
      const span = (60 + rand() * 50) * scale;
      const height = (70 + rand() * 60) * scale;
      ctx.fillRect(x, base - height, colW, height);
      ctx.fillRect(x + span, base - height, colW, height);
      ctx.beginPath();
      ctx.moveTo(x, base - height);
      ctx.arc(x + (span + colW) / 2, base - height, (span + colW) / 2, Math.PI, 0);
      ctx.lineTo(x + span + colW, base - height + 10 * scale);
      ctx.arc(x + (span + colW) / 2, base - height + 10 * scale, (span - colW) / 2, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
      x += span + colW + (20 + rand() * 60) * scale;
    } else if (kind < 0.8) {
      // columna rota
      const height = (40 + rand() * 90) * scale;
      ctx.fillRect(x, base - height, colW, height);
      ctx.beginPath();
      ctx.moveTo(x, base - height);
      ctx.lineTo(x + colW * 0.4, base - height - 8 * scale);
      ctx.lineTo(x + colW, base - height + 4 * scale);
      ctx.closePath();
      ctx.fill();
      x += colW + (25 + rand() * 50) * scale;
    } else {
      // muro bajo escalonado
      const width = (50 + rand() * 60) * scale;
      const height = (18 + rand() * 30) * scale;
      ctx.fillRect(x, base - height, width, height);
      ctx.fillRect(x + width * 0.2, base - height - 10 * scale, width * 0.35, 10 * scale);
      x += width + (20 + rand() * 40) * scale;
    }
  }
}

// ---------------------------------------------------------------- muros

/** Piedra de las ruinas. `top` = tiene la cara superior expuesta. */
export function drawWall(ctx: Ctx, s: number, variant: number, top: boolean): void {
  const rand = rng(31 + variant * 97);
  ctx.fillStyle = ART_COLORS.stone;
  ctx.fillRect(0, 0, s, s);
  // ladrillos en dos hileras
  const rowH = s / 2;
  for (let row = 0; row < 2; row++) {
    const offset = (row + variant) % 2 === 0 ? 0 : s / 2;
    for (let bx = -offset; bx < s; bx += s) {
      const shade = 0.9 + rand() * 0.25;
      ctx.fillStyle = shadeColor(ART_COLORS.stone, shade);
      ctx.fillRect(bx + 1, row * rowH + 1, s - 2, rowH - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(bx + 1, row * rowH + 1, s - 2, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(bx + 1, row * rowH + rowH - 3, s - 2, 2);
    }
  }
  ctx.fillStyle = ART_COLORS.stoneDark;
  ctx.fillRect(0, rowH - 1, s, 2);
  // grietas
  if (variant === 2) {
    ctx.strokeStyle = 'rgba(20,14,30,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s * 0.3, s * 0.55);
    ctx.lineTo(s * 0.45, s * 0.7);
    ctx.lineTo(s * 0.4, s * 0.9);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(10,6,20,0.35)';
  ctx.fillRect(0, s - 1, s, 1);
  if (top) {
    ctx.fillStyle = ART_COLORS.stoneLip;
    ctx.fillRect(0, 0, s, 3);
    ctx.fillStyle = 'rgba(255,220,190,0.35)';
    ctx.fillRect(0, 0, s, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 3, s, 1);
    // musgo
    ctx.fillStyle = ART_COLORS.moss;
    for (let i = 0; i < 3; i++) {
      const mx = rand() * (s - 6);
      ctx.fillRect(mx, 2, 4 + rand() * 4, 2);
      ctx.fillRect(mx + 1, 4, 2, 1 + Math.floor(rand() * 3));
    }
  }
}

function shadeColor(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------- pozos

/** Pozo de luz: líquido dorado y luminoso (solo Lumo lo pisa). */
export function drawLightPit(ctx: Ctx, s: number, top: boolean): void {
  ctx.fillStyle = vGradient(ctx, 0, s, [
    [0, top ? ART_COLORS.lightPale : ART_COLORS.light],
    [0.35, ART_COLORS.light],
    [1, ART_COLORS.lightDeep],
  ]);
  ctx.fillRect(0, 0, s, s);
  const rand = rng(top ? 5 : 6);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(0.35 + rand() * 0.45).toFixed(2)})`;
    const x = rand() * s;
    const y = (top ? 8 : 0) + rand() * (s - (top ? 8 : 0));
    ctx.fillRect(x, y, 2, 2);
  }
  // bordes de piedra a los costados para leer el "pozo"
  ctx.fillStyle = 'rgba(160,90,20,0.35)';
  ctx.fillRect(0, s - 2, s, 2);
}

/** Pozo de sombra: humo violeta oscuro con borde lavanda (solo Umbra lo pisa). */
export function drawShadowPit(ctx: Ctx, s: number, top: boolean): void {
  ctx.fillStyle = vGradient(ctx, 0, s, [
    [0, ART_COLORS.shadow],
    [1, ART_COLORS.shadowDeep],
  ]);
  ctx.fillRect(0, 0, s, s);
  const rand = rng(top ? 8 : 9);
  for (let i = 0; i < 5; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const r = 4 + rand() * 7;
    ctx.fillStyle = radial(ctx, x, y, r, [
      [0, 'rgba(10,4,20,0.55)'],
      [1, 'rgba(10,4,20,0)'],
    ]);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(200,170,255,${(0.25 + rand() * 0.35).toFixed(2)})`;
    ctx.fillRect(rand() * s, (top ? 8 : 0) + rand() * (s - 8), 1, 1);
  }
  if (top) {
    ctx.fillStyle = 'rgba(180,140,255,0.55)';
    ctx.fillRect(0, 0, s, 2);
  }
}

/** Abismo: vacío casi negro con bruma violeta arriba. */
export function drawAbyss(ctx: Ctx, s: number, top: boolean): void {
  ctx.fillStyle = vGradient(ctx, 0, s, [
    [0, top ? '#1c1030' : '#0b0714'],
    [1, ART_COLORS.abyss],
  ]);
  ctx.fillRect(0, 0, s, s);
  if (top) {
    ctx.fillStyle = vGradient(ctx, 0, s * 0.6, [
      [0, 'rgba(150,110,200,0.35)'],
      [1, 'rgba(150,110,200,0)'],
    ]);
    ctx.fillRect(0, 0, s, s * 0.6);
  }
}

// ---------------------------------------------------------------- personajes

/** Tamaño de diseño de los personajes; se escalan al tamaño real de la textura. */
const CHAR_DESIGN_W = 32;
const CHAR_DESIGN_H = 40;

/** Lumo: espíritu de luz, redondo y cálido, con una llamita. Mira a la derecha. */
export function drawLumo(ctx: Ctx, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / CHAR_DESIGN_W, h / CHAR_DESIGN_H);
  drawLumoDesign(ctx, CHAR_DESIGN_W, CHAR_DESIGN_H);
  ctx.restore();
}

function drawLumoDesign(ctx: Ctx, w: number, h: number): void {
  const cx = w / 2;
  const cy = h - 15;
  // llamita
  ctx.fillStyle = vGradient(ctx, 2, cy, [
    [0, ART_COLORS.lumoCore],
    [1, ART_COLORS.lumo],
  ]);
  ctx.beginPath();
  ctx.moveTo(cx + 2, 2);
  ctx.quadraticCurveTo(cx + 9, cy - 10, cx + 4, cy - 8);
  ctx.lineTo(cx - 5, cy - 8);
  ctx.quadraticCurveTo(cx - 5, cy - 16, cx + 2, 2);
  ctx.fill();
  // cuerpo
  ctx.fillStyle = radial(ctx, cx - 3, cy - 4, 15, [
    [0, ART_COLORS.lumoCore],
    [0.45, ART_COLORS.lumo],
    [1, '#f0a830'],
  ]);
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = ART_COLORS.lumoEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // ojos
  ctx.fillStyle = '#3b2610';
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy - 1, 1.8, 3, 0, 0, TAU);
  ctx.ellipse(cx + 7, cy - 1, 1.8, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + 1, cy - 3, 1, 1);
  ctx.fillRect(cx + 7, cy - 3, 1, 1);
  // mejillas
  ctx.fillStyle = 'rgba(255,140,90,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy + 3, 2.5, 1.5, 0, 0, TAU);
  ctx.ellipse(cx + 10, cy + 3, 2, 1.5, 0, 0, TAU);
  ctx.fill();
}

/** Umbra: espíritu de sombra encapuchado con ojos brillantes. Mira a la derecha. */
export function drawUmbra(ctx: Ctx, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / CHAR_DESIGN_W, h / CHAR_DESIGN_H);
  drawUmbraDesign(ctx, CHAR_DESIGN_W, CHAR_DESIGN_H);
  ctx.restore();
}

function drawUmbraDesign(ctx: Ctx, w: number, h: number): void {
  const cx = w / 2;
  const top = 4;
  const bottom = h - 2;
  const half = 12;
  ctx.beginPath();
  ctx.moveTo(cx - half, bottom - 4);
  ctx.lineTo(cx - half, top + half);
  ctx.arc(cx, top + half, half, Math.PI, 0);
  // capucha con punta hacia atrás
  ctx.lineTo(cx + half, bottom - 4);
  // borde inferior ondulado
  const waves = 3;
  const step = (half * 2) / waves;
  for (let i = 0; i < waves; i++) {
    const x0 = cx + half - i * step;
    ctx.quadraticCurveTo(x0 - step / 2, bottom + 2, x0 - step, bottom - 4);
  }
  ctx.closePath();
  ctx.fillStyle = vGradient(ctx, top, bottom, [
    [0, ART_COLORS.umbra],
    [1, ART_COLORS.umbraDeep],
  ]);
  ctx.fill();
  ctx.strokeStyle = ART_COLORS.umbraOutline;
  ctx.lineWidth = 2;
  ctx.stroke();
  // cara (hueco de la capucha)
  ctx.fillStyle = '#120822';
  ctx.beginPath();
  ctx.ellipse(cx + 3, top + 14, 7.5, 6.5, 0, 0, TAU);
  ctx.fill();
  // ojos brillantes
  ctx.fillStyle = radial(ctx, cx + 3, top + 14, 9, [
    [0, 'rgba(220,190,255,0.5)'],
    [1, 'rgba(220,190,255,0)'],
  ]);
  ctx.fillRect(cx - 6, top + 5, 18, 18);
  ctx.fillStyle = ART_COLORS.umbraEyes;
  ctx.beginPath();
  ctx.ellipse(cx, top + 14, 1.6, 2.6, 0, 0, TAU);
  ctx.ellipse(cx + 6, top + 14, 1.6, 2.6, 0, 0, TAU);
  ctx.fill();
}

/** Halo de luz alrededor de Lumo (se dibuja en modo aditivo). */
export function drawLumoAura(ctx: Ctx, s: number): void {
  const c = s / 2;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, 'rgba(255,214,120,0.55)'],
    [0.35, 'rgba(255,190,90,0.18)'],
    [1, 'rgba(255,190,90,0)'],
  ]);
  ctx.fillRect(0, 0, s, s);
}

/** Penumbra alrededor de Umbra. */
export function drawUmbraAura(ctx: Ctx, s: number): void {
  const c = s / 2;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, 'rgba(70,30,120,0.45)'],
    [0.5, 'rgba(50,20,90,0.2)'],
    [1, 'rgba(40,15,70,0)'],
  ]);
  ctx.fillRect(0, 0, s, s);
}

// ---------------------------------------------------------------- puertas

/** Pedestal de la puerta (el tile sólido que se pisa) con el emblema. */
export function drawDoorBase(ctx: Ctx, s: number, who: 'lumo' | 'umbra'): void {
  const main = who === 'lumo' ? '#c99a3a' : '#6c4fa3';
  const light = who === 'lumo' ? '#ffe9a8' : '#d9c2ff';
  ctx.fillStyle = vGradient(ctx, 0, s, [
    [0, light],
    [0.15, main],
    [1, shadeColor(main, 0.55)],
  ]);
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = shadeColor(main, 0.45);
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, s - 2, s - 2);
  if (who === 'lumo') {
    drawSunIcon(ctx, s / 2, s / 2 + 2, 9, '#fff3c4');
  } else {
    drawMoonIcon(ctx, s / 2, s / 2 + 2, 8, '#f1e8ff');
  }
}

/** Arco-portal que se alza sobre el pedestal (decorativo, sin física). */
export function drawDoorArch(ctx: Ctx, w: number, h: number, who: 'lumo' | 'umbra'): void {
  const frame = who === 'lumo' ? '#e0b04a' : '#8f6ad0';
  const glow = who === 'lumo' ? 'rgba(255,220,130,' : 'rgba(170,130,255,';
  const r = w / 2 - 3;
  // interior luminoso
  ctx.fillStyle = vGradient(ctx, 0, h, [
    [0, `${glow}0.15)`],
    [1, `${glow}0.55)`],
  ]);
  ctx.beginPath();
  ctx.moveTo(4, h);
  ctx.lineTo(4, r + 3);
  ctx.arc(w / 2, r + 3, r - 1, Math.PI, 0);
  ctx.lineTo(w - 4, h);
  ctx.closePath();
  ctx.fill();
  // marco
  ctx.strokeStyle = frame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(3, h);
  ctx.lineTo(3, r + 3);
  ctx.arc(w / 2, r + 3, r, Math.PI, 0);
  ctx.lineTo(w - 3, h);
  ctx.stroke();
  // clave del arco
  if (who === 'lumo') {
    drawSunIcon(ctx, w / 2, 6, 5, '#fff3c4');
  } else {
    drawMoonIcon(ctx, w / 2, 7, 4.5, '#f1e8ff');
  }
}

// ---------------------------------------------------------------- mecanismos (se tiñen por ID)

export function drawButton(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = '#8c8c8c';
  ctx.fillRect(1, h - 4, w - 2, 4);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(4, 0, w - 8, h - 3, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(4, h - 6, w - 8, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(7, 1, w - 14, 2);
}

/** Palanca inclinada a la izquierda (apagada); encendida se espeja. */
export function drawLever(ctx: Ctx, w: number, h: number): void {
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w / 2, h - 6);
  ctx.lineTo(w / 2 - 8, 5);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(w / 2 - 8, 5, 4.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9a9a9a';
  ctx.beginPath();
  ctx.roundRect(5, h - 7, w - 10, 7, 3);
  ctx.fill();
  ctx.fillStyle = '#bdbdbd';
  ctx.fillRect(7, h - 7, w - 14, 2);
}

/** Compuerta: rastrillo de barras (gris para teñir con el color del ID). */
export function drawGate(ctx: Ctx, s: number): void {
  ctx.fillStyle = '#6e6e6e';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#ffffff';
  for (let x = 3; x < s; x += 7) {
    ctx.fillRect(x, 0, 4, s);
  }
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 4, s, 4);
  ctx.fillRect(0, s - 8, s, 4);
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, s - 2, s - 2);
  // remaches
  ctx.fillStyle = '#4a4a4a';
  for (const x of [5, s - 7]) {
    ctx.fillRect(x, 5, 2, 2);
    ctx.fillRect(x, s - 7, 2, 2);
  }
}

// ---------------------------------------------------------------- gemas y bloques

export function drawGem(ctx: Ctx, s: number, kind: 'gold' | 'violet'): void {
  const base = kind === 'gold' ? '#ffcf40' : '#9b6bd6';
  const light = kind === 'gold' ? '#fff3b0' : '#e2d0ff';
  const dark = kind === 'gold' ? '#c9901c' : '#5a368f';
  const c = s / 2;
  const r = 10;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, kind === 'gold' ? 'rgba(255,220,120,0.45)' : 'rgba(190,150,255,0.45)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.fillRect(0, 0, s, s);
  // facetas
  const pts = {
    top: [c, c - r],
    right: [c + r * 0.8, c - 2],
    bottom: [c, c + r],
    left: [c - r * 0.8, c - 2],
  } as const;
  const face = (a: readonly number[], b: readonly number[], color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(c, c - 2);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fill();
  };
  face(pts.left, pts.top, light);
  face(pts.top, pts.right, base);
  face(pts.right, pts.bottom, dark);
  face(pts.bottom, pts.left, base);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts.top[0], pts.top[1]);
  ctx.lineTo(pts.right[0], pts.right[1]);
  ctx.lineTo(pts.bottom[0], pts.bottom[1]);
  ctx.lineTo(pts.left[0], pts.left[1]);
  ctx.closePath();
  ctx.stroke();
}

/** Cristal oscuro: bloque facetado de amatista negra. Lleva el sol: Lumo lo rompe. */
export function drawCrystal(ctx: Ctx, s: number): void {
  const m = 6;
  // biseles (luz desde arriba a la izquierda)
  const facet = (pts: ReadonlyArray<readonly [number, number]>, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) {
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };
  facet([[0, 0], [s, 0], [s - m, m], [m, m]], '#7a62b0');
  facet([[0, 0], [m, m], [m, s - m], [0, s]], '#5a4690');
  facet([[s, 0], [s, s], [s - m, s - m], [s - m, m]], '#2c1f4a');
  facet([[0, s], [m, s - m], [s - m, s - m], [s, s]], '#1d1433');
  // cara central con brillo interno
  ctx.fillStyle = radial(ctx, s * 0.4, s * 0.38, s * 0.55, [
    [0, '#5c4592'],
    [1, '#2a1d45'],
  ]);
  ctx.fillRect(m, m, s - 2 * m, s - 2 * m);
  ctx.strokeStyle = 'rgba(200,180,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(m + 1, m + 1);
  ctx.lineTo(m + 5, m + 1);
  ctx.moveTo(m + 1, m + 1);
  ctx.lineTo(m + 1, m + 5);
  ctx.stroke();
  ctx.strokeStyle = '#120a22';
  ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
  drawSunIcon(ctx, s / 2, s / 2, 5.5, '#ffd166', 0.95);
}

/** Barrera de luz: cortina de rayos dorados. Lleva la luna: Umbra la apaga. */
export function drawBarrier(ctx: Ctx, s: number): void {
  ctx.fillStyle = 'rgba(255,224,140,0.28)';
  ctx.fillRect(0, 0, s, s);
  for (let x = 3; x < s; x += 7) {
    ctx.fillStyle = 'rgba(255,240,190,0.35)';
    ctx.fillRect(x - 1, 0, 5, s);
    ctx.fillStyle = 'rgba(255,250,225,0.95)';
    ctx.fillRect(x + 1, 0, 1, s);
  }
  ctx.strokeStyle = 'rgba(255,246,207,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, s - 2, s - 2);
  ctx.fillStyle = 'rgba(40,20,70,0.65)';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 8, 0, TAU);
  ctx.fill();
  drawMoonIcon(ctx, s / 2, s / 2, 5.5, '#e9dcff');
}

// ---------------------------------------------------------------- partículas

/** Punto blanco suave para tintar (chispas, motas). */
export function drawSpark(ctx: Ctx, s: number): void {
  const c = s / 2;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, 'rgba(255,255,255,1)'],
    [0.4, 'rgba(255,255,255,0.7)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.fillRect(0, 0, s, s);
}

/** Bocanada de humo blanco suave para tintar. */
export function drawSmoke(ctx: Ctx, s: number): void {
  const c = s / 2;
  ctx.fillStyle = radial(ctx, c, c, c, [
    [0, 'rgba(255,255,255,0.8)'],
    [0.6, 'rgba(255,255,255,0.3)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.fillRect(0, 0, s, s);
}
