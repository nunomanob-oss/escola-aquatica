// Pernas de crol com material: prancha (respiração frontal) e esparguete debaixo das axilas.
import { applyPose } from "../rig";
import { FACE, POSE, flutter, merge, phase } from "../motion";
import { makeBoard, makeNoodle } from "../props";

const travel = (t, duration) => -2.2 + 4.2 * (t / duration);

export const pernasPrancha = {
  camera: [0.8, 1.2, 3.0],
  target: [0, -0.1, 0],
  duration: 10,
  captions: [[0, "Braços esticados na prancha, cara na água a soltar o ar"], [2.6, "Queixo à frente para inspirar"], [3.6, "Pés em ponta, batimento a partir da anca"]],
  setup({ swimmer, scene, bubbles }) {
    const kid = swimmer(0x2fe06b);
    const board = makeBoard();
    scene.add(board);
    let last = 0;
    return (t) => {
      const cycle = t % 4;
      const breathe = phase(cycle, 2.6, 2.9) * (1 - phase(cycle, 3.4, 3.7));
      applyPose(kid, merge(POSE.streamline, flutter(t), {
        shoulderL: [Math.PI - 0.15, 0, -0.18], shoulderR: [Math.PI - 0.15, 0, 0.18],
        head: [-0.85 * breathe, 0, 0], spine: -0.12 * breathe,
        pos: [travel(t, 10), -0.05, 0], quat: FACE.proneX,
      }));
      kid.root.updateMatrixWorld(true);
      const hand = kid.joints.wristL.getWorldPosition(board.position.clone());
      board.position.set(hand.x + 0.12, 0.0, 0);
      const mouth = kid.mouth();
      if (mouth.y < -0.01 && t - last > 0.07) {
        bubbles.emit(mouth);
        last = t;
      }
      if (t < last) last = 0;
    };
  },
};

export const pernasEsparguete = {
  camera: [0.6, 1.1, 3.0],
  target: [0, -0.1, 0],
  duration: 10,
  captions: [[0, "Esparguete debaixo das axilas, corpo deitado"], [3, "Pés em ponta: empurra a água para trás"], [6, "Cara na água para fazer borbulhas"]],
  setup({ swimmer, scene, bubbles }) {
    const kid = swimmer(0xff6fb1);
    const noodle = makeNoodle();
    noodle.rotation.y = Math.PI / 2;
    scene.add(noodle);
    let last = 0;
    return (t) => {
      const dip = phase(t, 6, 6.4) * (1 - phase(t, 7.6, 8));
      applyPose(kid, merge(flutter(t, 8), {
        shoulderL: [-2.4, 0, 0.35], shoulderR: [-2.4, 0, -0.35], elbowL: -0.4, elbowR: -0.4,
        head: [-0.9 * (1 - dip), 0, 0], pos: [travel(t, 10), -0.06, 0], quat: FACE.proneX,
      }));
      kid.root.updateMatrixWorld(true);
      const chest = kid.joints.head.getWorldPosition(noodle.position.clone());
      noodle.position.set(chest.x - 0.2, 0.0, 0);
      const mouth = kid.mouth();
      if (mouth.y < -0.01 && t - last > 0.06) {
        bubbles.emit(mouth);
        last = t;
      }
      if (t < last) last = 0;
    };
  },
};

export const KICK_PRESETS = { "pernas-prancha": pernasPrancha, "pernas-esparguete": pernasEsparguete };
