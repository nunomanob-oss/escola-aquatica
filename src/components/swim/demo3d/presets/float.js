// Flutuações: estrela ventral, estrela dorsal e estrela a dormir.
import { applyPose, mixPose, orient } from "../rig";
import { FACE, POSE, STAND_Y, merge, phase } from "../motion";
import { makeNoodle } from "../props";

const SUPINE_BACK = orient([-1, 0, 0], [0, 1, 0]); // deitado de costas ao inclinar para trás

// Ciclo: de pé → inspirar → estrela → joelhos ao peito → de pé.
function starCycle(kid, t, lying, lyingY) {
  const stand = merge(POSE.stand, { pos: [0, STAND_Y, 0], quat: FACE.standX, head: [-0.15 * phase(t, 0, 0.8), 0, 0] });
  const star = merge(POSE.star, { pos: [0.15, lyingY + Math.sin(t * 1.4) * 0.012, 0], quat: lying });
  const tuck = merge(POSE.tuck, { pos: [0.1, STAND_Y - 0.05, 0], quat: FACE.standX });
  let pose;
  if (t < 2.6) pose = mixPose(stand, star, phase(t, 1.1, 2.6));
  else if (t < 6.2) pose = star;
  else if (t < 7.6) pose = mixPose(star, tuck, phase(t, 6.2, 7.6));
  else pose = mixPose(tuck, stand, phase(t, 7.6, 8.8));
  applyPose(kid, pose);
}

export const estrelaVentral = {
  camera: [1.6, 1.3, 2.6],
  target: [0, -0.2, 0],
  duration: 9.5,
  captions: [[0, "Inspira fundo e segura o ar"], [1.1, "Cara na água, braços e pernas abertos em estrela"], [6.2, "Para levantar: joelhos ao peito, mãos empurram a água"], [7.8, "Pés no chão"]],
  setup({ swimmer }) {
    const kid = swimmer(0xff6fb1);
    return (t) => starCycle(kid, t, FACE.proneX, -0.08);
  },
};

export const estrelaDorsal = {
  camera: [1.4, 1.5, 2.4],
  target: [0, -0.2, 0],
  duration: 9.5,
  captions: [[0, "Inspira fundo"], [1.1, "Cabeça para trás: orelhas na água, barriga ao sol"], [6.2, "Queixo ao peito, joelhos ao peito"], [7.8, "Pés no chão"]],
  setup({ swimmer }) {
    const kid = swimmer(0x2fe06b);
    return (t) => starCycle(kid, t, SUPINE_BACK, -0.06);
  },
};

export const estrelaDormir = {
  camera: [0.4, 1.8, 2.2],
  target: [0, -0.1, 0],
  duration: 8,
  captions: [[0, "Esparguete debaixo dos joelhos, estrela de costas"], [3, "Olhos fechados: inspira em 4, expira em 6"]],
  setup({ swimmer, scene }) {
    const kid = swimmer(0xffd23f);
    const noodle = makeNoodle();
    noodle.rotation.y = Math.PI / 2;
    scene.add(noodle);
    return (t) => {
      const breath = Math.sin((t / 8) * Math.PI * 2);
      applyPose(kid, merge(POSE.star, {
        shoulderL: [0, 0, 1.9], shoulderR: [0, 0, -1.9], kneeL: 0.25, kneeR: 0.25,
        spine: breath * 0.03, pos: [0.3, -0.05 + breath * 0.012, 0], quat: SUPINE_BACK,
      }));
      kid.root.updateMatrixWorld(true);
      const knee = kid.joints.kneeL.getWorldPosition(noodle.position.clone());
      noodle.position.set(knee.x, -0.02, 0);
    };
  },
};

export const FLOAT_PRESETS = { "estrela-ventral": estrelaVentral, "estrela-dorsal": estrelaDorsal, "estrela-dormir": estrelaDormir };
