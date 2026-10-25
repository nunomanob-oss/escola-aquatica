// Exercícios junto à parede: comboio, borbulhas e pernas de crol agarrado à borda.
import { applyPose } from "../rig";
import { FACE, POSE, STAND_Y, flutter, merge, phase } from "../motion";

// Mãos em cima da borda, de frente para a parede (ângulos ajustados para x = WALL_X_HOLD).
const HOLD = { shoulderL: [-2.05, 0, 0.15], shoulderR: [-2.05, 0, -0.15], elbowL: -0.4, elbowR: -0.4 };
const WALL_X_HOLD = -2.48;

export const comboio = {
  zoom: 0.9,
  camera: [0.2, 1.4, 3.2],
  target: [-2.3, -0.1, 0],
  duration: 9,
  captions: [[0, "Passos de lado, sempre agarrados à borda"], [4, "Saltinhos no sítio"], [6.5, "Esconder os ombros dentro de água"]],
  setup({ swimmer }) {
    const kids = [0xffd23f, 0x2fe06b, 0xff6fb1].map((c) => swimmer(c));
    return (t) =>
      kids.forEach((kid, i) => {
        const side = Math.sin(t * 5 + i);
        const step = t < 4 ? { hipL: [0, 0, Math.max(0, side) * 0.35], hipR: [0, 0, -Math.max(0, -side) * 0.35] } : {};
        const hop = t >= 4 && t < 6.5 ? Math.abs(Math.sin(t * 6 + i)) * 0.12 : 0;
        const crouch = phase(t, 6.5, 7.2) * (1 - phase(t, 8.4, 9)) * 0.12;
        const z = -1.4 + i * 1.1 + Math.min(t, 4) * 0.18;
        const reach = -2.05 - crouch * 4;
        applyPose(kid, merge(POSE.stand, HOLD, step, {
          shoulderL: [reach, 0, 0.15], shoulderR: [reach, 0, -0.15],
          kneeL: crouch * 4, kneeR: crouch * 4, hipL: step.hipL || [-crouch * 2.4, 0, 0], hipR: step.hipR || [-crouch * 2.4, 0, 0],
          pos: [WALL_X_HOLD, STAND_Y + hop - crouch, z], quat: FACE.standWall,
        }));
      });
  },
};

export const borbulhas = {
  zoom: 0.88,
  camera: [-0.6, 0.6, 2.4],
  target: [-2.4, 0, 0],
  duration: 6,
  captions: [[0, "Inspira pela boca, fora de água"], [1.6, "Cara na água: borbulhas pelo nariz e pela boca"], [5, "Levanta a cara e repete"]],
  setup({ swimmer, bubbles }) {
    const kid = swimmer(0x2fe06b);
    let last = 0;
    return (t) => {
      const down = phase(t, 1.2, 1.8) * (1 - phase(t, 4.8, 5.4));
      // Em baixo: baixa 10 cm, inclina o tronco para a parede e baixa a cabeça (boca dentro de água).
      const reach = -2.05 - 0.95 * down;
      applyPose(kid, merge(POSE.stand, HOLD, {
        shoulderL: [reach, 0, 0.15], shoulderR: [reach, 0, -0.15],
        hipL: [-0.24 * down, 0, 0], hipR: [-0.24 * down, 0, 0], kneeL: 0.4 * down, kneeR: 0.4 * down,
        head: [0.6 * down - 0.15 * (1 - down), 0, 0], spine: 0.45 * down,
        pos: [WALL_X_HOLD, STAND_Y - 0.1 * down, 0], quat: FACE.standWall,
      }));
      kid.root.updateMatrixWorld(true);
      const mouth = kid.mouth();
      if (mouth.y < -0.01 && t - last > 0.05) {
        bubbles.emit(mouth);
        last = t;
      }
      if (t < last) last = 0;
    };
  },
};

export const pernasBorda = {
  camera: [0.4, 1.0, 2.6],
  target: [-1.7, -0.1, 0],
  duration: 8,
  captions: [[0, "Braços esticados, mãos na borda, cara na água"], [5, "Levanta a cara para respirar e continua"]],
  setup({ swimmer, bubbles }) {
    const kid = swimmer(0xffd23f);
    let last = 0;
    return (t) => {
      const breathe = phase(t, 5, 5.4) * (1 - phase(t, 6.2, 6.6));
      applyPose(kid, merge(POSE.streamline, flutter(t), {
        shoulderL: [Math.PI - 0.2, 0, -0.15], shoulderR: [Math.PI - 0.2, 0, 0.15],
        head: [-0.9 * breathe, 0, 0], spine: -0.15 * breathe,
        pos: [-2.0, -0.04 + 0.03 * breathe, 0], quat: FACE.proneWall,
      }));
      kid.root.updateMatrixWorld(true);
      const mouth = kid.mouth();
      if (mouth.y < -0.01 && t - last > 0.08) {
        bubbles.emit(mouth);
        last = t;
      }
      if (t < last) last = 0;
    };
  },
};

export const WALL_PRESETS = { comboio, borbulhas, "pernas-borda": pernasBorda };
