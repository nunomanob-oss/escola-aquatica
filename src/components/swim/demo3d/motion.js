// Movimentos de base reutilizados pelas demonstrações.
import { orient } from "./rig";
import { FLOOR } from "./pool";

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (v) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
// Progresso (0→1, suavizado) entre os segundos a e b.
export const phase = (t, a, b) => smooth((t - a) / (b - a));

export const STAND_Y = FLOOR + 0.65;
export const FACE = {
  standX: orient([0, 1, 0], [1, 0, 0]), // de pé, virado para +X
  standWall: orient([0, 1, 0], [-1, 0, 0]), // de pé, virado para a parede
  standZ: orient([0, 1, 0], [0, 0, 1]),
  proneX: orient([1, 0, 0], [0, -1, 0]), // deitado de barriga, cabeça para +X
  proneWall: orient([-1, 0, 0], [0, -1, 0]), // deitado de barriga, cabeça para a parede
  supineX: orient([1, 0, 0], [0, 1, 0]), // deitado de costas, cabeça para +X
  dive: orient([0.45, -1, 0], [1, 0.45, 0]), // a mergulhar de cabeça para o fundo
};

export const POSE = {
  stand: { ankleL: 0.1, ankleR: 0.1, shoulderL: [0, 0, 0.12], shoulderR: [0, 0, -0.12], elbowL: -0.2, elbowR: -0.2 },
  streamline: { shoulderL: [Math.PI, 0, -0.08], shoulderR: [Math.PI, 0, 0.08], ankleL: 1.2, ankleR: 1.2 },
  star: { shoulderL: [0, 0, 2.3], shoulderR: [0, 0, -2.3], hipL: [0, 0, 0.45], hipR: [0, 0, -0.45], ankleL: 1, ankleR: 1 },
  tuck: { hipL: [-1.9, 0, 0], hipR: [-1.9, 0, 0], kneeL: 2.2, kneeR: 2.2, shoulderL: [-0.6, 0, 0.3], shoulderR: [-0.6, 0, -0.3], elbowL: -1.2, elbowR: -1.2, head: [0.5, 0, 0] },
};

// Batimento de crol: alternado, a partir da anca, joelhos quase esticados, pés em ponta.
export function flutter(t, speed = 9, amp = 0.32) {
  const s = Math.sin(t * speed);
  return {
    hipL: [s * amp, 0, 0.04],
    hipR: [-s * amp, 0, -0.04],
    kneeL: 0.18 + Math.max(0, s) * 0.3,
    kneeR: 0.18 + Math.max(0, -s) * 0.3,
    ankleL: 1.25,
    ankleR: 1.25,
  };
}

// Braçada de crol simplificada (os braços rodam no ombro, desfasados meia volta).
export function crolArms(t, speed = 2.6) {
  const a = Math.PI + t * speed;
  const bend = (x) => -0.6 * Math.max(0, Math.sin(x - Math.PI));
  return {
    shoulderL: [a, 0, 0.1],
    shoulderR: [a + Math.PI, 0, -0.1],
    elbowL: bend(a),
    elbowR: bend(a + Math.PI),
  };
}

// Marcha dentro de água (de pé).
export function walk(t, speed = 4) {
  const s = Math.sin(t * speed);
  return {
    hipL: [-s * 0.35, 0, 0],
    hipR: [s * 0.35, 0, 0],
    kneeL: 0.3 + Math.max(0, s) * 0.5,
    kneeR: 0.3 + Math.max(0, -s) * 0.5,
    shoulderL: [s * 0.4, 0, 0.35],
    shoulderR: [-s * 0.4, 0, -0.35],
    elbowL: -0.5,
    elbowR: -0.5,
    ankleL: 0.2,
    ankleR: 0.2,
  };
}

export const merge = (...poses) => Object.assign({}, ...poses);
