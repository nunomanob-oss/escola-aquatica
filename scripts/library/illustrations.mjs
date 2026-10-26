// Esquemas SVG dos exercícios da biblioteca (BIB-…), em corte lateral da piscina.
// Uso: node scripts/library/illustrations.mjs → public/exercicios/<CODE>.svg
// Cores segundo o padrão das ilustrações (docs/BIBLIOTECA.md): a pele debaixo de água
// recebe um véu turquesa a 35%, por isso as figuras são desenhadas com a pele natural
// e o véu da água é pintado por cima de tudo o que fica abaixo da superfície.
import { readFileSync, writeFileSync } from "node:fs";

const W = 480;
const H = 320;
const SURFACE = 150; // linha de água
const DECK = 130; // topo do cais
const WALL = 86; // parede da piscina (o cais fica à esquerda)
const BOTTOM = 300;

const C = {
  outline: "#123B4A",
  skin: "#F2B48C",
  skinShade: "#D9926A",
  skinDark: "#8D5A3B",
  skinDarkShade: "#6E4229",
  water: "#3AAEBB",
  surface: "#6CC9CE",
  deep: "#2A8C99",
  tiles: "#CFEFEC",
  wall: "#E6F6F5",
  suit: "#1B3A5C",
  polo: "#1F3B57",
  board: "#F5C04A",
  buoy: "#F28C38",
  fins: "#E25D4E",
  paddles: "#7B61C9",
};

const rad = (deg) => (deg * Math.PI) / 180;
const at = (p, deg, len) => [p[0] + Math.cos(rad(deg)) * len, p[1] + Math.sin(rad(deg)) * len];
const r1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${r1(p[0])},${r1(p[1])}`;

// ── Figura ────────────────────────────────────────────────────────────────────
// Pose em ângulos absolutos (graus, 0 = direita, 90 = para baixo) para uma figura virada à direita.
// arms/legs: [lado de lá, lado de cá], cada um [segmento de cima, segmento de baixo].
// face: para onde olha a cara (ângulo). flip espelha a figura na horizontal.
const SEG = { torso: 44, neck: 13, head: 9.5, upper: 23, fore: 21, thigh: 27, shin: 27 };

function joints({ hip, torso, arms, legs, flip = false, scale = 1, head = 0 }) {
  const f = (deg) => (flip ? 180 - deg : deg);
  const s = scale;
  const shoulder = at(hip, f(torso), SEG.torso * s);
  const headC = at(shoulder, f(torso + head), SEG.neck * s);
  const limb = (from, [a, b], l1, l2) => {
    const mid = at(from, f(a), l1 * s);
    return [from, mid, at(mid, f(b), l2 * s)];
  };
  return {
    s,
    flip,
    hip,
    shoulder,
    headC,
    arms: arms.map((a) => limb(shoulder, a, SEG.upper, SEG.fore)),
    legs: legs.map((l) => limb(hip, l, SEG.thigh, SEG.shin)),
  };
}

const line = (pts, width, color) =>
  `<polyline points="${pts.map(pt).join(" ")}" fill="none" stroke="${color}" stroke-width="${r1(width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const limbSvg = (pts, width, color) => line(pts, width + 3, C.outline) + line(pts, width, color);

function figure(pose, opts = {}) {
  const j = joints(pose);
  const { s } = j;
  const dark = opts.dark;
  const skin = dark ? C.skinDark : C.skin;
  const shade = dark ? C.skinDarkShade : C.skinShade;
  const face = pose.flip ? 180 - pose.face : pose.face;
  const out = [];
  const gear = opts.gear || {};

  // lado de lá primeiro, num tom de sombra
  out.push(limbSvg(j.legs[0], 9 * s, shade));
  if (gear.fins) out.push(fin(j.legs[0], s));
  out.push(limbSvg(j.arms[0], 6.5 * s, shade));
  if (gear.paddles) out.push(paddle(j.arms[0], s));

  // tronco e fato de banho
  out.push(limbSvg([j.hip, j.shoulder], 17 * s, skin));
  const suitTop = opts.costume === "full" ? 0.8 : 0.32;
  out.push(line([j.hip, lerp(j.hip, j.shoulder, suitTop)], 17 * s, C.suit));
  out.push(line([j.hip, lerp(j.hip, j.legs[1][1], 0.28)], 10 * s, C.suit));
  out.push(line([j.hip, lerp(j.hip, j.legs[0][1], 0.28)], 10 * s, C.suit));

  // pescoço e cabeça com touca
  out.push(limbSvg([j.shoulder, lerp(j.shoulder, j.headC, 0.6)], 6 * s, skin));
  const hr = SEG.head * s;
  out.push(`<circle cx="${r1(j.headC[0])}" cy="${r1(j.headC[1])}" r="${r1(hr + 1.5)}" fill="${C.outline}"/>`);
  out.push(`<circle cx="${r1(j.headC[0])}" cy="${r1(j.headC[1])}" r="${r1(hr)}" fill="${skin}"/>`);
  // touca: meia-lua do lado oposto à cara
  const top = pose.flip ? 180 - (pose.torso + (pose.head || 0)) : pose.torso + (pose.head || 0);
  const back = face + 180;
  const capA = top + (((back - top + 540) % 360) - 180) / 2;
  const c1 = at(j.headC, capA - 95, hr + 0.5);
  const c2 = at(j.headC, capA + 95, hr + 0.5);
  out.push(
    `<path d="M${pt(c1)} A${r1(hr + 0.5)} ${r1(hr + 0.5)} 0 1 1 ${pt(c2)} Z" fill="${opts.cap || C.suit}" stroke="${C.outline}" stroke-width="1.5"/>`,
  );
  // olho (e óculos quando treino)
  const nose = at(j.headC, face, hr + 2.6 * s);
  out.push(`<polygon points="${pt(at(j.headC, face - 28, hr - 0.5))} ${pt(nose)} ${pt(at(j.headC, face + 8, hr - 0.5))}" fill="${skin}" stroke="${C.outline}" stroke-width="1.3" stroke-linejoin="round"/>`);
  const eye = at(j.headC, face - 35, hr * 0.5);
  out.push(`<circle cx="${r1(eye[0])}" cy="${r1(eye[1])}" r="${r1(1.6 * s)}" fill="${C.outline}"/>`);
  if (gear.snorkel) out.push(snorkel(j.headC, face, hr));
  if (gear.metronome) {
    const m = at(j.headC, face + 180, hr * 0.6);
    out.push(`<circle cx="${r1(m[0])}" cy="${r1(m[1])}" r="${r1(2.6 * s)}" fill="${C.fins}" stroke="${C.outline}" stroke-width="1"/>`);
  }

  // lado de cá
  out.push(limbSvg(j.legs[1], 9 * s, skin));
  if (gear.fins) out.push(fin(j.legs[1], s));
  if (gear.pullbuoy) {
    const p = lerp(j.hip, j.legs[1][1], 0.55);
    const a = angleOf(j.hip, j.legs[1][1]);
    out.push(
      `<rect x="${r1(p[0] - 9 * s)}" y="${r1(p[1] - 6 * s)}" width="${r1(18 * s)}" height="${r1(12 * s)}" rx="${r1(5 * s)}" fill="${C.buoy}" stroke="${C.outline}" stroke-width="1.5" transform="rotate(${r1(a)} ${pt(p)})"/>`,
    );
  }
  if (gear.elastic) {
    const a = j.legs[0][2];
    const b = j.legs[1][2];
    out.push(line([lerp(j.legs[0][1], a, 0.8), lerp(j.legs[1][1], b, 0.8)], 3, C.fins));
  }
  if (gear.belt) out.push(line([lerp(j.hip, j.shoulder, 0.12), lerp(j.hip, j.shoulder, 0.24)], 19 * s, C.fins));
  out.push(limbSvg(j.arms[1], 6.5 * s, skin));
  if (gear.paddles) out.push(paddle(j.arms[1], s));
  if (gear.fist) out.push(...j.arms.map((a) => `<circle cx="${r1(a[2][0])}" cy="${r1(a[2][1])}" r="${r1(3.6 * s)}" fill="${C.outline}"/>`));
  return { svg: out.join(""), j };
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const angleOf = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

function fin([, knee, foot], s) {
  const a = angleOf(knee, foot);
  const tip = at(foot, a, 20 * s);
  const l = at(tip, a + 90, 6 * s);
  const r = at(tip, a - 90, 6 * s);
  return `<polygon points="${pt(at(foot, a - 90, 4 * s))} ${pt(l)} ${pt(r)} ${pt(at(foot, a + 90, 4 * s))}" fill="${C.fins}" stroke="${C.outline}" stroke-width="1.5" stroke-linejoin="round"/>`;
}

function paddle([, elbow, hand], s) {
  const a = angleOf(elbow, hand);
  const p = at(hand, a, 2 * s);
  return `<rect x="${r1(p[0] - 7 * s)}" y="${r1(p[1] - 3 * s)}" width="${r1(14 * s)}" height="${r1(6 * s)}" rx="2" fill="${C.paddles}" stroke="${C.outline}" stroke-width="1.5" transform="rotate(${r1(a)} ${pt(p)})"/>`;
}

function snorkel(headC, face, hr) {
  const base = at(headC, face, hr + 1);
  const top = [base[0], base[1] - 3 * hr];
  return line([base, [base[0], base[1] - hr * 0.5], top], 5, C.outline) + line([base, [base[0], base[1] - hr * 0.5], top], 2.5, C.board);
}

// ── Material solto ────────────────────────────────────────────────────────────
const board = (p, angle = 0, s = 1) =>
  `<rect x="${r1(p[0] - 4)}" y="${r1(p[1] - 5 * s)}" width="${r1(40 * s)}" height="${r1(10 * s)}" rx="${r1(5 * s)}" fill="${C.board}" stroke="${C.outline}" stroke-width="1.5" transform="rotate(${angle} ${pt(p)})"/>`;
const noodle = (p, s = 1) =>
  `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(7 * s)}" fill="${C.board}" stroke="${C.outline}" stroke-width="1.5"/><circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(2.5 * s)}" fill="${C.outline}" opacity=".5"/>`;
const ball = (p, r = 9) =>
  `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r} " fill="${C.board}" stroke="${C.outline}" stroke-width="1.5"/><path d="M${p[0] - r} ${p[1]} Q${p[0]} ${p[1] - r * 0.5} ${p[0] + r} ${p[1]} M${p[0]} ${p[1] - r} Q${p[0] - r * 0.5} ${p[1]} ${p[0]} ${p[1] + r}" fill="none" stroke="${C.outline}" stroke-width="1.2"/>`;
const ring = (x, color) =>
  `<ellipse cx="${x}" cy="${BOTTOM - 3}" rx="10" ry="3.5" fill="none" stroke="${C.outline}" stroke-width="5"/><ellipse cx="${x}" cy="${BOTTOM - 3}" rx="10" ry="3.5" fill="none" stroke="${color}" stroke-width="3"/>`;
const stick = (x, color) =>
  `<rect x="${x - 3}" y="${BOTTOM - 26}" width="6" height="26" rx="2" fill="${color}" stroke="${C.outline}" stroke-width="1.5"/>`;
const hoop = (p) =>
  `<ellipse cx="${p[0]}" cy="${p[1]}" rx="5" ry="16" fill="none" stroke="${C.outline}" stroke-width="6"/><ellipse cx="${p[0]}" cy="${p[1]}" rx="5" ry="16" fill="none" stroke="${C.fins}" stroke-width="3.5"/>`;
const bubbles = (p, n = 4, dir = -1) =>
  Array.from({ length: n }, (_, i) => {
    const q = [p[0] + (i % 2 ? 5 : -3) + i, p[1] + dir * (6 + i * 9)];
    return `<circle cx="${r1(q[0])}" cy="${r1(q[1])}" r="${2 + (i % 3)}" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity=".9"/>`;
  }).join("");
const splash = (p) =>
  `<path d="M${p[0] - 10} ${p[1]} q4 -10 8 -2 M${p[0] - 2} ${p[1] - 1} q3 -13 7 -1 M${p[0] + 6} ${p[1]} q5 -8 9 0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
const arrow = (from, to, curve = 0) => {
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + curve];
  const a = angleOf(mid, to);
  const h1 = at(to, a + 150, 8);
  const h2 = at(to, a - 150, 8);
  return `<path d="M${pt(from)} Q${pt(mid)} ${pt(to)}" fill="none" stroke="${C.outline}" stroke-width="2.2" stroke-dasharray="6 5" opacity=".75"/><polygon points="${pt(to)} ${pt(h1)} ${pt(h2)}" fill="${C.outline}" opacity=".75"/>`;
};
const spin = (c, r = 24) =>
  `<path d="M${c[0] + r} ${c[1]} A${r} ${r} 0 1 1 ${c[0]} ${c[1] - r}" fill="none" stroke="${C.outline}" stroke-width="2.2" stroke-dasharray="6 5" opacity=".75"/><polygon points="${c[0]},${c[1] - r} ${c[0] + 9},${c[1] - r - 5} ${c[0] + 8},${c[1] - r + 6}" fill="${C.outline}" opacity=".75"/>`;
const speed = (p) =>
  [0, 8, 16].map((dy, i) => `<line x1="${p[0] - 20 - i * 6}" y1="${p[1] + dy - 8}" x2="${p[0] - 46 - i * 6}" y2="${p[1] + dy - 8}" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`).join("");

// ── Cenário ───────────────────────────────────────────────────────────────────
function pool({ lane = false, clock = false, flags = false, block = false, rail = false, ladder = false } = {}) {
  const o = [];
  o.push(`<rect width="${W}" height="${H}" fill="${C.wall}"/>`);
  // janelas e luzes
  for (let x = 120; x < W; x += 120) {
    o.push(`<rect x="${x}" y="34" width="92" height="52" rx="3" fill="#FFFFFF" stroke="${C.outline}" stroke-opacity=".35" stroke-width="1.5"/>`);
    o.push(`<line x1="${x + 46}" y1="34" x2="${x + 46}" y2="86" stroke="${C.outline}" stroke-opacity=".25" stroke-width="1.5"/>`);
    o.push(`<rect x="${x + 26}" y="10" width="40" height="5" rx="2" fill="#FFFFFF" stroke="${C.outline}" stroke-opacity=".3"/>`);
  }
  // azulejos da parede ao fundo, acima da água
  o.push(`<rect x="0" y="100" width="${W}" height="${SURFACE - 100}" fill="${C.tiles}"/>`);
  for (let x = 0; x < W; x += 16) o.push(`<line x1="${x}" y1="100" x2="${x}" y2="${SURFACE}" stroke="#FFFFFF" stroke-width="1"/>`);
  for (let y = 100; y < SURFACE; y += 16) o.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#FFFFFF" stroke-width="1"/>`);
  if (clock) {
    o.push(`<circle cx="410" cy="66" r="15" fill="#FFFFFF" stroke="${C.outline}" stroke-width="2"/>`);
    o.push(`<path d="M410 66 L410 55 M410 66 L418 70" stroke="${C.outline}" stroke-width="2" stroke-linecap="round"/>`);
  }
  if (flags) {
    o.push(`<path d="M${WALL} 104 Q290 116 ${W} 104" fill="none" stroke="${C.outline}" stroke-width="1.2"/>`);
    for (let x = WALL + 14; x < W; x += 22) {
      const y = 104 + 12 * Math.sin(((x - WALL) / (W - WALL)) * Math.PI) * 0.9;
      o.push(`<polygon points="${x - 5},${r1(y)} ${x + 5},${r1(y)} ${x},${r1(y + 10)}" fill="${(x / 22) % 2 < 1 ? C.fins : C.board}"/>`);
    }
  }
  // água e fundo
  o.push(`<rect x="${WALL}" y="${SURFACE}" width="${W - WALL}" height="${BOTTOM - SURFACE}" fill="${C.water}"/>`);
  o.push(`<rect x="${WALL}" y="${BOTTOM}" width="${W - WALL}" height="${H - BOTTOM}" fill="${C.deep}"/>`);
  for (let x = WALL; x < W; x += 24) o.push(`<line x1="${x}" y1="${BOTTOM}" x2="${x}" y2="${H}" stroke="${C.outline}" stroke-opacity=".2"/>`);
  o.push(`<rect x="${WALL + 30}" y="${BOTTOM + 6}" width="${W - WALL - 30}" height="6" fill="${C.outline}" opacity=".25"/>`);
  // cais e parede
  o.push(`<rect x="0" y="${DECK}" width="${WALL}" height="${H - DECK}" fill="${C.tiles}" stroke="${C.outline}" stroke-width="2"/>`);
  for (let y = DECK + 18; y < H; y += 18) o.push(`<line x1="0" y1="${y}" x2="${WALL}" y2="${y}" stroke="${C.outline}" stroke-opacity=".15"/>`);
  o.push(`<rect x="0" y="${DECK - 4}" width="${WALL + 4}" height="6" fill="#FFFFFF" stroke="${C.outline}" stroke-width="2"/>`);
  if (ladder) {
    o.push(`<path d="M${WALL + 4} ${DECK - 16} q12 0 12 14 L${WALL + 16} ${BOTTOM - 40} M${WALL + 4} ${DECK + 20} h12 M${WALL + 4} ${DECK + 50} h12 M${WALL + 4} ${DECK + 80} h12" fill="none" stroke="${C.outline}" stroke-width="3" stroke-linecap="round"/>`);
  }
  if (block) {
    o.push(`<path d="M50 ${DECK} L56 ${DECK - 26} L${WALL + 2} ${DECK - 30} L${WALL - 2} ${DECK}" fill="${C.suit}" stroke="${C.outline}" stroke-width="2" stroke-linejoin="round"/>`);
  }
  if (rail) o.push(`<rect x="${WALL}" y="${SURFACE - 9}" width="${W - WALL}" height="6" fill="#FFFFFF" stroke="${C.outline}" stroke-opacity=".5"/>`);
  return o.join("");
}

function laneRope() {
  const o = [];
  for (let x = WALL + 8; x < W; x += 14) {
    o.push(`<ellipse cx="${x}" cy="${SURFACE}" rx="6" ry="4" fill="${(x - WALL) % 56 < 14 ? C.fins : "#FFFFFF"}" stroke="${C.outline}" stroke-width="1"/>`);
  }
  return o.join("");
}

// Instrutor no cais, de polo e calções.
function coach(x = 40, gesture = "point") {
  const j = joints({ hip: [x, DECK - 50], torso: -90, arms: [], legs: [[97, 92], [83, 88]], scale: 0.95 });
  const arms =
    gesture === "point" ? [[100, 84], [-12, -20]] : gesture === "up" || gesture === "card" ? [[100, 84], [-25, -55]] : [[100, 84], [80, 70]];
  const arm = (a) => {
    const mid = at(j.shoulder, a[0], SEG.upper * 0.95);
    return [j.shoulder, mid, at(mid, a[1], SEG.fore * 0.95)];
  };
  const [far, near] = arms.map(arm);
  const o = [];
  j.legs.forEach((l) => o.push(limbSvg(l, 8, C.skin)));
  j.legs.forEach((l) => o.push(limbSvg([l[0], lerp(l[0], l[1], 0.7)], 11, C.polo)));
  o.push(limbSvg(far, 6.5, C.skinShade), limbSvg([far[0], lerp(far[0], far[1], 0.5)], 8.5, C.polo));
  o.push(limbSvg([j.hip, j.shoulder], 20, C.polo));
  o.push(limbSvg([j.shoulder, lerp(j.shoulder, j.headC, 0.6)], 6, C.skin));
  o.push(`<circle cx="${r1(j.headC[0])}" cy="${r1(j.headC[1])}" r="10.5" fill="${C.outline}"/><circle cx="${r1(j.headC[0])}" cy="${r1(j.headC[1])}" r="9" fill="${C.skin}"/>`);
  o.push(`<path d="M${pt(at(j.headC, 170, 10))} A10 10 0 0 1 ${pt(at(j.headC, -10, 10))} Z" fill="${C.outline}"/>`);
  o.push(`<circle cx="${r1(j.headC[0] + 5)}" cy="${r1(j.headC[1] + 1)}" r="1.5" fill="${C.outline}"/>`);
  o.push(limbSvg(near, 6.5, C.skin), limbSvg([near[0], lerp(near[0], near[1], 0.5)], 8.5, C.polo));
  if (gesture === "card") o.push(`<rect x="${r1(near[2][0] - 2)}" y="${r1(near[2][1] - 16)}" width="14" height="16" rx="2" fill="${C.fins}" stroke="${C.outline}" stroke-width="1.5"/>`);
  return o.join("");
}

// ── Poses ────────────────────────────────────────────────────────────────────
// Cada pose recebe {x, y, s, flip, ...} e devolve o SVG da figura.
const P = {
  crol: ({ x, y = SURFACE + 3, s = 1, flip, breath, oneArm, catchup, evf, gear }) =>
    figure(
      {
        hip: [x, y + 2],
        torso: -2,
        head: breath ? -12 : 4,
        face: breath ? -25 : 55,
        flip,
        scale: s,
        arms: [
          oneArm ? [178, 180] : catchup ? [-6, -2] : [-112, 18],
          evf ? [10, 85] : catchup ? [2, 4] : [4, 14],
        ],
        legs: [
          [176, 186],
          [184, 174],
        ],
      },
      { gear },
    ),
  crolLado: ({ x, y = SURFACE + 2, s = 1, flip, gear }) =>
    figure({ hip: [x, y + 2], torso: -1, head: -4, face: -10, flip, scale: s, arms: [[0, 2], [172, 176]], legs: [[176, 186], [184, 172]] }, { gear }),
  costas: ({ x, y = SURFACE + 3, s = 1, flip, double, oneArm, gear }) =>
    figure(
      {
        hip: [x, y + 4],
        torso: -3,
        head: -6,
        face: -80,
        flip,
        scale: s,
        arms: [double ? [-88, -90] : oneArm ? [176, 178] : [174, 176], double ? [-92, -94] : [-88, -86]],
        legs: [
          [178, 186],
          [182, 172],
        ],
      },
      { gear },
    ),
  costasPernas: ({ x, y = SURFACE + 3, s = 1, flip, armsSide, gear }) =>
    figure(
      {
        hip: [x, y + 4],
        torso: -3,
        head: -6,
        face: -80,
        flip,
        scale: s,
        arms: armsSide ? [[176, 178], [174, 176]] : [[-12, -4], [-8, 0]],
        legs: [
          [178, 188],
          [182, 170],
        ],
      },
      { gear },
    ),
  brucos: ({ x, y = SURFACE + 3, s = 1, flip, flutter, gear }) =>
    figure(
      {
        hip: [x, y + 6],
        torso: -10,
        head: 4,
        face: 5,
        flip,
        scale: s,
        arms: [
          [30, -12],
          [40, -6],
        ],
        legs: flutter
          ? [
              [176, 188],
              [186, 172],
            ]
          : [
              [162, 218],
              [154, 212],
            ],
      },
      { gear },
    ),
  brucosPernas: ({ x, y = SURFACE + 3, s = 1, flip, armsBack, gear }) =>
    figure(
      {
        hip: [x, y + 5],
        torso: -6,
        head: 2,
        face: armsBack ? 15 : 40,
        flip,
        scale: s,
        arms: armsBack ? [[172, 176], [170, 174]] : [[-4, -2], [4, 2]],
        legs: [
          [162, 218],
          [154, 212],
        ],
      },
      { gear },
    ),
  brucosCostas: ({ x, y = SURFACE + 3, s = 1, flip }) =>
    figure({ hip: [x, y + 8], torso: -3, head: -6, face: -80, flip, scale: s, arms: [[174, 176], [172, 174]], legs: [[175, 125], [178, 130]] }, {}),
  mariposa: ({ x, y = SURFACE + 3, s = 1, flip, oneArm, breath, gear }) =>
    figure(
      {
        hip: [x, y + 7],
        torso: -8,
        head: breath ? -6 : 10,
        face: breath ? 0 : 40,
        flip,
        scale: s,
        arms: oneArm ? [[4, 8], [-40, -10]] : [[-42, -14], [-36, -8]],
        legs: [
          [178, 166],
          [182, 171],
        ],
      },
      { gear },
    ),
  deslize: ({ x, y = SURFACE + 3, s = 1, flip, gear }) =>
    figure({ hip: [x, y + 3], torso: 0, head: 6, face: 70, flip, scale: s, arms: [[-1, -1], [1, 1]], legs: [[176, 186], [184, 174]] }, { gear }),
  ondulacao: ({ x, y = SURFACE + 55, s = 1, flip, dorsal, gear }) =>
    figure(
      {
        hip: [x, y],
        torso: -4,
        head: dorsal ? -6 : 6,
        face: dorsal ? -80 : 60,
        flip,
        scale: s,
        arms: [
          [-3, -3],
          [-1, -1],
        ],
        legs: [
          [170, 196],
          [173, 199],
        ],
      },
      { gear },
    ),
  pernasPrancha: ({ x, y = SURFACE + 3, s = 1, flip, breath, gear }) =>
    figure(
      {
        hip: [x, y + 6],
        torso: -10,
        head: breath ? -6 : -2,
        face: breath ? -20 : 10,
        flip,
        scale: s,
        arms: breath ? [[172, 176], [-4, 2]] : [[-6, 2], [-4, 4]],
        legs: [
          [176, 188],
          [186, 172],
        ],
      },
      { gear },
    ),
  estrelaV: ({ x, y = SURFACE + 3, s = 1, flip }) =>
    figure({ hip: [x, y + 3], torso: 0, head: 10, face: 90, flip, scale: s, arms: [[-14, -14], [12, 12]], legs: [[166, 166], [194, 194]] }, {}),
  estrelaD: ({ x, y = SURFACE + 3, s = 1, flip }) =>
    figure({ hip: [x, y + 4], torso: -2, head: -8, face: -88, flip, scale: s, arms: [[-30, -28], [24, 26]], legs: [[168, 170], [192, 190]] }, {}),
  costasJoelhos: ({ x, y = SURFACE + 3, s = 1, flip }) =>
    figure({ hip: [x, y + 6], torso: -3, head: -8, face: -88, flip, scale: s, arms: [[176, 178], [170, -95]], legs: [[196, 164], [194, 162]] }, {}),
  remar: ({ x, y, s = 1, flip }) =>
    figure({ hip: [x, y], torso: -90, head: 0, face: 0, flip, scale: s, arms: [[50, -10], [35, -20]], legs: [[102, 94], [78, 86]] }, {}),
  vertical: ({ x, y = SURFACE + 46, s = 1, flip, arms = [[60, 20], [40, 0]], legs = [[102, 94], [78, 86]], face = 0, gear }) =>
    figure({ hip: [x, y], torso: -90, head: 0, face, flip, scale: s, arms, legs }, { gear }),
  mergulho: ({ x, y = SURFACE + 60, s = 1, flip }) =>
    figure({ hip: [x, y], torso: 58, head: 0, face: 100, flip, scale: s, arms: [[62, 60], [56, 54]], legs: [[236, 250], [228, 216]] }, {}),
  voo: ({ x, y, s = 1, flip }) =>
    figure({ hip: [x, y], torso: 12, head: 0, face: 40, flip, scale: s, arms: [[14, 14], [12, 12]], legs: [[192, 194], [190, 192]] }, {}),
  entrada: ({ x, y, s = 1, flip }) =>
    figure({ hip: [x, y], torso: 45, head: 0, face: 80, flip, scale: s, arms: [[46, 46], [44, 44]], legs: [[222, 224], [220, 222]] }, {}),
  saltoPe: ({ x, y, s = 1, flip }) =>
    figure({ hip: [x, y], torso: -90, head: 0, face: 0, flip, scale: s, arms: [[-30, -10], [-20, 0]], legs: [[94, 90], [86, 90]] }, {}),
  // A meio da cambalhota: de cabeça para baixo, joelhos encostados ao peito, queixo ao peito.
  cambalhota: ({ x, y, s = 1, flip }) =>
    figure({ hip: [x, y], torso: 90, head: 30, face: 190, flip, scale: s, arms: [[175, -80], [185, -70]], legs: [[125, -70], [135, -80]] }, {}),
  sentado: ({ x, y = DECK - 2, s = 1, flip }) =>
    figure({ hip: [x, y], torso: -100, head: 4, face: 10, flip, scale: s, arms: [[120, 95], [105, 90]], legs: [[-8, 76], [6, 100]] }, {}),
  remadaCabeca: ({ x, y = SURFACE + 3, s = 1, flip }) =>
    figure({ hip: [x, y + 5], torso: -3, head: -6, face: -80, flip, scale: s, arms: [[150, 120], [160, 110]], legs: [[180, 182], [182, 180]] }, {}),
  rolo: ({ x, y = SURFACE + 4, s = 1, flip }) =>
    figure({ hip: [x, y + 4], torso: -2, head: 0, face: 30, flip, scale: s, arms: [[-30, -20], [178, 176]], legs: [[176, 182], [184, 178]] }, {}),
};

// ── Cenas ─────────────────────────────────────────────────────────────────────
// Uma cena devolve {back, figures, front}: fundo, figuras (vão levar véu se submersas) e extras.
function veil() {
  return `<rect x="${WALL}" y="${SURFACE}" width="${W - WALL}" height="${BOTTOM - SURFACE}" fill="${C.water}" opacity=".35"/>`;
}
function surfaceLine() {
  return `<rect x="${WALL}" y="${SURFACE - 1}" width="${W - WALL}" height="5" fill="${C.surface}" opacity=".7"/><line x1="${WALL}" y1="${SURFACE}" x2="${W}" y2="${SURFACE}" stroke="#FFFFFF" stroke-width="2.5"/>`;
}

function render(spec, meta) {
  const s = meta.scale * FIG;
  const g = spec.gear;
  const env = { lane: spec.lane, clock: spec.clock, flags: spec.flags, block: spec.block, rail: spec.rail, ladder: spec.ladder };
  const figs = [];
  const front = [];
  const above = [];
  const X = 290;
  const mk = (name, o) => P[name]({ s, gear: g, ...o });

  switch (spec.scene) {
    case "crol":
    case "crolLado":
    case "costas":
    case "costasPernas":
    case "brucos":
    case "brucosPernas":
    case "brucosCostas":
    case "mariposa":
    case "deslize":
    case "pernasPrancha":
    case "estrelaV":
    case "estrelaD":
    case "remadaCabeca":
    case "costasJoelhos":
    case "rolo": {
      const back = spec.scene.startsWith("costas") || spec.scene === "remadaCabeca" || spec.scene === "brucosCostas";
      const f = mk(spec.scene, { x: spec.second ? X - 60 : X - 20, y: SURFACE + 5 * s, ...spec.pose });
      figs.push(f.svg);
      const j = f.j;
      if (spec.board === "hands") figs.push(board(lerp(j.arms[1][2], j.arms[0][2], 0.5), back ? 0 : 0, s));
      if (spec.board === "belly") figs.push(board([j.hip[0] + 4, j.hip[1] - 9 * s], -3, s));
      if (spec.board === "hand") figs.push(board(j.arms[1][2], 0, s));
      if (spec.pbKnees) figs.push(`<rect x="${r1(j.legs[1][1][0] - 10 * s)}" y="${r1(j.legs[1][1][1] + 4 * s)}" width="${r1(20 * s)}" height="${r1(11 * s)}" rx="${r1(5 * s)}" fill="${C.buoy}" stroke="${C.outline}" stroke-width="1.5"/>`);
      if (spec.noodle) figs.push(noodle(back ? [j.shoulder[0] - 6, j.shoulder[1] + 9 * s] : [j.shoulder[0] + 2, j.shoulder[1] + 9 * s], s));
      if (spec.noodleKnees) figs.push(noodle([lerp(j.legs[1][0], j.legs[1][1], 1)[0], j.legs[1][1][1] + 8 * s], s));
      if (spec.cup) figs.push(`<rect x="${r1(j.headC[0] - 3)}" y="${r1(j.headC[1] - 17 * s)}" width="7" height="9" rx="1.5" fill="#FFFFFF" stroke="${C.outline}" stroke-width="1.5"/>`);
      if (spec.ball) front.push(ball(at(j.headC, 0, 26 * s).map((v, i) => (i ? SURFACE - 2 : v))));
      if (spec.hoop) front.push(hoop([W - 40, SURFACE]));
      if (spec.splash) front.push(splash([j.legs[1][2][0] + (spec.pose?.flip ? 6 : -6), SURFACE]));
      if (spec.speed) front.push(speed([j.legs[0][2][0] + 6, SURFACE + 6]));
      if (spec.spin) front.push(spin([j.hip[0] + 20, SURFACE + 4], 30));
      if (spec.bubbles) front.push(bubbles([j.headC[0] + 4, j.headC[1] + 8], 3));
      if (spec.tether) {
        front.push(line([lerp(j.hip, j.shoulder, 0.15), [WALL - 6, DECK - 10]], 2, C.outline));
        front.push(`<rect x="${WALL - 12}" y="${DECK - 16}" width="10" height="12" rx="2" fill="${C.suit}"/>`);
      }
      if (spec.second) {
        const f2 = mk(spec.second.scene, { x: X + 90, y: SURFACE + 2, s: s * 0.62, ...spec.second });
        figs.unshift(`<g opacity=".75">${f2.svg}</g>`);
      }
      if (!spec.noArrow) {
        const dir = spec.pose?.flip ? -1 : 1;
        const ax = back ? j.headC[0] : j.headC[0];
        front.push(arrow([ax + dir * 24, SURFACE + 46], [ax + dir * 74, SURFACE + 46]));
      }
      break;
    }
    case "ondulacao": {
      const f = mk("ondulacao", { x: X - 20, ...spec.pose });
      figs.push(f.svg);
      figs.push(arrow([f.j.headC[0] + 30, f.j.headC[1] + 30], [f.j.headC[0] + 80, f.j.headC[1] + 30]));
      figs.push(`<path d="M${r1(f.j.legs[1][2][0] - 4)} ${r1(f.j.legs[1][2][1] - 14)} q-10 14 0 28" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".8"/>`);
      break;
    }
    case "foguetao": {
      const f = figure(
        { hip: [WALL + 4 + (SEG.thigh + SEG.shin) * s, SURFACE + 48], torso: 0, head: 6, face: 70, scale: s, arms: [[-1, -1], [1, 1]], legs: [[180, 180], [180, 180]] },
        {},
      );
      figs.push(f.svg);
      figs.push(arrow([f.j.headC[0] + 40, SURFACE + 48], [f.j.headC[0] + 100, SURFACE + 48]));
      figs.push(bubbles([f.j.headC[0] - 30, SURFACE + 36], 3));
      break;
    }
    case "mergulho": {
      const f = mk("mergulho", { x: 250 });
      figs.push(f.svg);
      figs.push(bubbles([f.j.legs[0][2][0], f.j.legs[0][2][1] - 10], 3));
      const colours = [C.fins, C.board, C.paddles];
      if (spec.rings) [330, 380, 430].forEach((x, i) => front.push(ring(x, colours[i])));
      if (spec.sticks) [356, 410].forEach((x, i) => front.push(stick(x, colours[i + 1])));
      break;
    }
    case "saltoPe": {
      const f = mk("saltoPe", { x: 170, y: SURFACE - 54 * s + 46 });
      figs.push(f.svg);
      front.push(splash([170, SURFACE]));
      above.push(arrow([WALL + 2, DECK - 30], [140, DECK - 60], -26));
      break;
    }
    case "saltoCabeca": {
      const f = mk("entrada", { x: 168, y: SURFACE - 34 });
      figs.push(f.svg);
      front.push(splash([f.j.arms[1][2][0], SURFACE]));
      front.push(arrow([250, SURFACE + 60], [340, SURFACE + 60]));
      break;
    }
    case "partida": {
      env.block = true;
      const f = mk("voo", { x: 200, y: SURFACE - 44 });
      above.push(f.svg);
      above.push(arrow([WALL + 4, DECK - 40], [150, DECK - 64], -12));
      front.push(arrow([260, SURFACE + 50], [360, SURFACE + 50]));
      break;
    }
    case "cambalhota": {
      const x = spec.mid ? 300 : WALL + 60;
      const f = mk("cambalhota", { x, y: SURFACE + 34, flip: !spec.mid });
      figs.push(f.svg);
      front.push(spin([x, SURFACE + 46], 46));
      if (!spec.mid) front.push(arrow([x + 70, SURFACE + 100], [x + 160, SURFACE + 100]));
      break;
    }
    case "viragem":
    case "chegada": {
      const f = mk(spec.two ? "brucosPernas" : "crol", {
        x: WALL + 6 + (SEG.torso + SEG.upper + SEG.fore + SEG.neck * 0.4) * s,
        flip: true,
        pose: {},
        catchup: spec.two,
      });
      figs.push(f.svg);
      if (spec.scene === "viragem") front.push(arrow([WALL + 110, SURFACE + 70], [WALL + 210, SURFACE + 70], 20));
      if (spec.scene === "chegada") front.push(`<rect x="${WALL}" y="${SURFACE - 14}" width="5" height="56" fill="${C.board}" stroke="${C.outline}" stroke-width="1.5"/>`);
      break;
    }
    case "estafeta": {
      env.block = true;
      const a = mk("crol", { x: WALL + 6 + 100 * s * 0.9, flip: true, catchup: true, s: s * 0.9 });
      figs.push(a.svg);
      const b = mk("voo", { x: 150, y: SURFACE - 60, s: s * 0.9 });
      above.push(b.svg);
      break;
    }
    case "borda": {
      // aluno agarrado à borda (parede do cais), virado para a parede
      const f = mk("vertical", {
        x: WALL + 36 * s,
        flip: true,
        y: SURFACE + (spec.face ? 62 : 46) * s,
        arms: [[-40, -15], [-30, -5]],
        legs: spec.stretch ? [[150, 170], [92, 88]] : [[102, 94], [78, 86]],
        face: spec.face ? 50 : 0,
      });
      figs.push(f.svg);
      if (spec.face) front.push(bubbles([WALL + 20 * s, SURFACE + 6], 4));
      break;
    }
    case "pernasBorda": {
      const f = mk("pernasPrancha", { x: WALL + 6 + (SEG.torso + SEG.upper + SEG.fore - 4) * s, flip: true, y: SURFACE + 4 });
      figs.push(f.svg);
      front.push(splash([f.j.legs[1][2][0] + 4, SURFACE]));
      break;
    }
    case "sentado": {
      const f = mk("sentado", { x: WALL - 14, y: DECK - 4 });
      above.push(f.svg);
      front.push(splash([WALL + 40, SURFACE]));
      break;
    }
    case "grupo": {
      // vários alunos em pé/a flutuar na vertical
      const xs = spec.xs || [180, 270, 360];
      xs.forEach((x, i) => {
        const arms = spec.ball && i === 1 ? [[60, 20], [-55, -75]] : [[60, 20], [40, 0]];
        const under = spec.under && i === 1;
        const f = under
          ? mk("vertical", { x, y: BOTTOM - 30, arms: [[40, -20], [30, -30]], legs: [[-25, 75], [-35, 70]], face: 0 })
          : mk("vertical", { x, y: SURFACE + 46 * s, arms, face: 0, flip: i % 2 === 1 });
        figs.push(f.svg);
        if (under) front.push(bubbles([f.j.headC[0] + 6, f.j.headC[1] - 14], 3));
        if (spec.ball && i === 1) front.push(ball(at(f.j.arms[1][2], -90, 8), 10));
      });
      break;
    }
    case "comboio": {
      env.rail = true;
      [170, 250, 330].forEach((x) => {
        const f = mk("vertical", { x, y: SURFACE + 46 * s, arms: [[-20, -5], [-10, 0]] });
        figs.push(f.svg);
      });
      front.push(arrow([360, SURFACE + 100], [440, SURFACE + 100]));
      break;
    }
    case "remar": {
      const f = mk("remar", { x: 270, y: SURFACE + 46 * s });
      figs.push(f.svg);
      const h = f.j.arms[1][2];
      front.push(`<path d="M${r1(h[0] - 14)} ${r1(h[1])} c6 -10 12 -10 14 0 s8 10 14 0 s-8 -10 -14 0 s-8 10 -14 0" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".9"/>`);
      break;
    }
    case "moinho": {
      const f = mk("vertical", { x: 280, y: SURFACE + 46 * s, arms: [[-92, -92], [88, 88]] });
      figs.push(f.svg);
      front.push(spin([280, SURFACE - 20], 50));
      break;
    }
    case "tapete": {
      front.push(`<rect x="220" y="${SURFACE - 8}" width="130" height="14" rx="6" fill="${C.buoy}" stroke="${C.outline}" stroke-width="2"/>`);
      const a = mk("vertical", { x: 190, y: SURFACE + 46 * s, arms: [[-20, 10], [-30, 0]] });
      const b = mk("vertical", { x: 384, y: SURFACE + 46 * s, flip: true, arms: [[-20, 10], [-30, 0]] });
      figs.push(a.svg, b.svg);
      break;
    }
    case "tubaroes": {
      const a = figure({ hip: [170, SURFACE + 9], torso: -4, head: -12, face: -25, scale: s * 0.9, arms: [[-112, 18], [4, 14]], legs: [[176, 186], [184, 174]] }, { cap: C.fins });
      const b = mk("crol", { x: 350, s: s * 0.9, breath: true, y: SURFACE + 5 * s });
      figs.push(a.svg, b.svg);
      front.push(arrow([230, SURFACE + 70], [300, SURFACE + 70]));
      break;
    }
    case "estafetaPranchas": {
      const a = mk("pernasPrancha", { x: 200, s: s * 0.9 });
      const b = mk("pernasPrancha", { x: 340, s: s * 0.9 });
      figs.push(a.svg, board(lerp(a.j.arms[1][2], a.j.arms[0][2], 0.5), 0, s * 0.9));
      figs.push(b.svg, board(lerp(b.j.arms[1][2], b.j.arms[0][2], 0.5), 0, s * 0.9));
      break;
    }
    case "verticalBrucos": {
      const f = mk("vertical", { x: 280, y: SURFACE + 48, arms: [[-75, -95], [-105, -85]], legs: [[150, 60], [30, 120]] });
      figs.push(f.svg);
      break;
    }
    default:
      throw new Error(`cena desconhecida: ${spec.scene}`);
  }

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escape(meta.title)}">`,
    `<title>${escape(meta.title)}</title>`,
    pool(env),
    spec.lane ? laneRope() : "",
    spec.coach === "none" ? "" : coach(42, spec.coach || "point"),
    above.join(""),
    figs.join(""),
    veil(),
    surfaceLine(),
    front.join(""),
    `</svg>`,
  ];
  return parts.join("\n");
}

const escape = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// ── Mapa exercício → cena ────────────────────────────────────────────────────
// Sintaxe: "cena opção opção=valor". Opções de material: fins, pb (pull-buoy), pads, snorkel, metro, elastic, belt.
export const SCENES = JSON.parse(readFileSync(new URL("./illustrations.json", import.meta.url), "utf8"));

const GEAR = { fins: "fins", pb: "pullbuoy", pads: "paddles", snorkel: "snorkel", metro: "metronome", elastic: "elastic", belt: "belt", fist: "fist" };
const POSE = ["breath", "oneArm", "catchup", "evf", "double", "armsSide", "armsBack", "flutter", "dorsal"];

function parse(text) {
  const [scene, ...tokens] = text.split(/\s+/);
  const spec = { scene, gear: {}, pose: {} };
  for (const t of tokens) {
    if (GEAR[t]) spec.gear[GEAR[t]] = true;
    else if (POSE.includes(t)) spec.pose[t] = true;
    else if (t.startsWith("board=")) spec.board = t.slice(6);
    else if (t.startsWith("second=")) spec.second = { scene: t.slice(7) };
    else if (t.startsWith("coach=")) spec.coach = t.slice(6);
    else spec[t] = true;
  }
  return spec;
}

// As figuras dos alunos são maiores que o instrutor, que fica ao fundo, no cais.
const FIG = 1.5;
const SCALE = { INI: 0.82, APR: 0.88, APF: 0.94, ALT: 1, MST: 1 };

export function illustrate(exercise, text) {
  const group = exercise.code.split("-")[1];
  const scale = SCALE[group] || 1;
  return render(parse(text), { title: exercise.title, scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const library = JSON.parse(readFileSync("scripts/library/seed/exercise-library.json", "utf8"));
  const missing = library.filter((e) => !SCENES[e.code]).map((e) => e.code);
  if (missing.length) {
    console.error(`Sem cena: ${missing.join(", ")}`);
    process.exit(1);
  }
  for (const e of library) writeFileSync(`public/exercicios/${e.code}.svg`, `${illustrate(e, SCENES[e.code])}\n`);
  console.log(`${library.length} esquemas → public/exercicios/`);
}
