// Jogos: tubarões e peixinhos, ilha do tesouro.
import { applyPose, mixPose } from "../rig";
import { FACE, POSE, STAND_Y, crolArms, flutter, merge, phase, walk } from "../motion";
import { makeMat } from "../props";

export const tubaroes = {
  zoom: 0.9,
  camera: [0.3, 2.6, 4.2],
  target: [0, -0.3, 0],
  duration: 9,
  captions: [[0, "Os peixinhos atravessam de uma parede à outra"], [2.5, "Cabeça debaixo de água: estás a salvo!"]],
  setup({ swimmer }) {
    const sharks = [swimmer(0xe23d3d), swimmer(0xe23d3d)];
    const fish = [0, 1, 2, 3].map(() => swimmer(0xffd23f));
    return (t) => {
      const sharkPos = sharks.map((s, i) => [0.2 + i * 0.9, Math.sin(t * 0.9 + i * 2) * 1.0]);
      sharks.forEach((s, i) => {
        const [x, z] = sharkPos[i];
        applyPose(s, merge(walk(t, 3), { pos: [x, STAND_Y, z], quat: FACE.standWall, shoulderL: [-1.3, 0, 0.6], shoulderR: [-1.3, 0, -0.6] }));
      });
      fish.forEach((f, i) => {
        const x = -2.3 + 4.5 * phase(t, 0.3 + i * 0.3, 7.5 + i * 0.3);
        const z = -1.5 + i * 1.0;
        const near = sharkPos.some(([sx, sz]) => Math.abs(sx - x) < 0.55 && Math.abs(sz - z) < 0.6);
        const duck = near ? 1 : 0;
        f.duck = (f.duck || 0) + (duck - (f.duck || 0)) * 0.15;
        applyPose(f, mixPose(
          merge(walk(t + i, 4.5), { pos: [x, STAND_Y, z], quat: FACE.standX }),
          merge(POSE.tuck, { pos: [x, STAND_Y - 0.25, z], quat: FACE.standX }),
          f.duck
        ));
      });
    };
  },
};

export const ilhaTesouro = {
  zoom: 0.9,
  camera: [1.2, 1.6, 3.6],
  target: [-0.3, -0.1, 0],
  duration: 10,
  captions: [[0, "Nada até à ilha"], [4.2, "Sobe para o tapete e senta-te"], [7.2, "Volta à água com a entrada pedida"]],
  setup({ swimmer, scene }) {
    const kid = swimmer(0x2fe06b);
    const mat = makeMat();
    mat.position.set(0.85, 0.03, 0);
    scene.add(mat);
    const seated = merge({ hipL: [-1.55, 0, 0.1], hipR: [-1.55, 0, -0.1], kneeL: 1.5, kneeR: 1.5, shoulderL: [0, 0, 0.3], shoulderR: [-2.6, 0, -0.4] },
      { pos: [0.7, 0.13, 0], quat: FACE.standWall });
    const back = merge(POSE.stand, { pos: [-0.2, STAND_Y, 0], quat: FACE.standWall });
    return (t) => {
      let pose;
      if (t < 4) {
        const k = phase(t, 0, 4);
        pose = merge(flutter(t), crolArms(t), { pos: [-2.3 + 2.5 * k, -0.06, 0], quat: FACE.proneX, head: [-0.3, 0, 0] });
      } else if (t < 5.4) {
        const start = merge(POSE.streamline, { pos: [0.2, -0.04, 0], quat: FACE.proneX });
        pose = mixPose(start, seated, phase(t, 4, 5.4));
      } else if (t < 7.2) {
        pose = merge(seated, { shoulderR: [-2.6 + Math.sin(t * 6) * 0.3, 0, -0.4] });
      } else if (t < 8.6) pose = mixPose(seated, back, phase(t, 7.2, 8.6));
      else pose = mixPose(back, merge(POSE.stand, { pos: [-2.2, STAND_Y, 0], quat: FACE.standWall }), phase(t, 8.6, 10));
      applyPose(kid, pose);
    };
  },
};

export const GAME_PRESETS = { tubaroes, "ilha-tesouro": ilhaTesouro };
