// Mergulhos e entradas: mergulho aos tesouros, caça ao arco-íris e salto de pé.
import { applyPose, mixPose } from "../rig";
import { FACE, POSE, STAND_Y, crolArms, flutter, merge, phase } from "../motion";
import { DECK_Y, FLOOR, WALL_X } from "../pool";
import { makeRing } from "../props";

const RING_Y = FLOOR + 0.03;

// Mergulho de pé até um objeto no fundo, apanha-o e sobe a soltar o ar.
function diveCycle(kid, ring, home, t, bubbles, state) {
  const [hx, hz] = home;
  const target = ring.userData.home;
  const stand = merge(POSE.stand, { pos: [hx, STAND_Y, hz], quat: FACE.standX });
  const down = merge(POSE.streamline, { pos: [target.x - 0.55, FLOOR + 0.5, target.z], quat: FACE.dive, hipL: [0.3, 0, 0], hipR: [0.3, 0, 0], kneeL: 0.6, kneeR: 0.6 });
  const up = merge(POSE.stand, { pos: [target.x - 0.2, STAND_Y, target.z], quat: FACE.standX, shoulderR: [Math.PI - 0.1, 0, -0.2], elbowR: 0 });
  let pose;
  if (t < 1) pose = mixPose(stand, merge(stand, { head: [-0.2, 0, 0] }), phase(t, 0, 1));
  else if (t < 2.4) pose = mixPose(stand, down, phase(t, 1, 2.4));
  else if (t < 2.8) pose = down;
  else if (t < 4.3) pose = mixPose(down, up, phase(t, 2.8, 4.3));
  else if (t < 6.4) pose = up;
  else pose = mixPose(up, stand, phase(t, 6.4, 7.4));
  applyPose(kid, pose);
  kid.root.updateMatrixWorld(true);
  if (t >= 2.6 && t < 6.6) kid.joints.wristR.getWorldPosition(ring.position);
  else ring.position.copy(target);
  const mouth = kid.mouth();
  if (t > 2.8 && mouth.y < -0.02 && t - state.last > 0.05) {
    bubbles.emit(mouth);
    state.last = t;
  }
  if (t < state.last) state.last = 0;
}

function placeRing(scene, color, x, z) {
  const ring = makeRing(color);
  ring.userData.home = ring.position.set(x, RING_Y, z).clone();
  scene.add(ring);
  return ring;
}

export const mergulhoTesouros = {
  camera: [1.8, 0.4, 2.4],
  target: [0.4, -0.5, 0],
  duration: 8,
  captions: [[0, "Olhos abertos: escolhe um tesouro"], [1, "Inspira e mergulha"], [2.4, "Apanha um de cada vez"], [2.8, "Sobe a soltar o ar pelo nariz"], [4.3, "Leva o tesouro para a borda"]],
  setup({ swimmer, scene, bubbles }) {
    const kid = swimmer(0x2fe06b);
    const ring = placeRing(scene, 0xe23d3d, 1.1, 0.2);
    placeRing(scene, 0x0a84ff, 1.6, -0.4);
    placeRing(scene, 0xffd23f, 0.6, -0.8);
    const state = { last: 0 };
    return (t) => diveCycle(kid, ring, [0, 0.2], t, bubbles, state);
  },
};

export const cacaArcoIris = {
  zoom: 0.9,
  camera: [2.2, 0.6, 3.0],
  target: [0.6, -0.5, 0],
  duration: 8,
  captions: [[0, "Cada equipa procura a sua cor"], [2.4, "Um objeto de cada vez"], [4.3, "Leva-o à borda e volta"]],
  setup({ swimmer, scene, bubbles }) {
    const kids = [swimmer(0xffd23f), swimmer(0x0a84ff)];
    const rings = [placeRing(scene, 0xffd23f, 1.0, 0.7), placeRing(scene, 0x0a84ff, 1.5, -0.7)];
    placeRing(scene, 0xe23d3d, 2.0, 0.1);
    placeRing(scene, 0x30d158, 0.8, -0.1);
    const states = [{ last: 0 }, { last: 0 }];
    return (t) =>
      kids.forEach((kid, i) => diveCycle(kid, rings[i], [-0.1, i ? -0.7 : 0.7], (t + i * 4) % 8, bubbles, states[i]));
  },
};

export const saltoPe = {
  zoom: 0.9,
  camera: [0.8, 1.0, 3.2],
  target: [-1.9, -0.1, 0],
  duration: 9,
  captions: [[0, "Dedos dos pés na borda, olha em frente"], [1, "Salta com os pés juntos"], [2, "Debaixo de água, solta o ar"], [3.4, "Sobe, procura a borda com os olhos"], [4.8, "Nada até à borda"]],
  setup({ swimmer, bubbles }) {
    const kid = swimmer(0xff6fb1);
    let last = 0;
    const onDeck = merge(POSE.stand, { pos: [WALL_X - 0.25, DECK_Y + 0.65, 0], quat: FACE.standX, shoulderL: [-0.4, 0, 0.2], shoulderR: [-0.4, 0, -0.2] });
    const under = merge(POSE.stand, { pos: [-1.6, FLOOR + 0.75, 0], quat: FACE.standX, shoulderL: [0, 0, 0.9], shoulderR: [0, 0, -0.9] });
    const surface = merge(POSE.stand, { pos: [-1.6, -0.2, 0], quat: FACE.standWall, kneeL: 0.8, kneeR: 0.2, hipL: [-0.6, 0, 0], shoulderL: [-0.6, 0, 0.8], shoulderR: [-0.6, 0, -0.8] });
    return (t) => {
      let pose;
      if (t < 1) pose = onDeck;
      else if (t < 2) {
        const k = phase(t, 1, 2);
        pose = mixPose(onDeck, under, k);
        pose.pos[1] += Math.sin(Math.PI * Math.min(1, (t - 1) / 0.5)) * 0.25 * (t < 1.5 ? 1 : 0);
      } else if (t < 3.4) pose = under;
      else if (t < 4.8) pose = mixPose(under, surface, phase(t, 3.4, 4.8));
      else if (t < 8) {
        const k = phase(t, 4.8, 8);
        pose = merge(flutter(t), crolArms(t), { pos: [-1.6 - 0.75 * k, -0.06, 0], quat: FACE.proneWall, head: [-0.3, 0, 0] });
      } else pose = merge(POSE.streamline, { pos: [-2.35, -0.05, 0], quat: FACE.proneWall, shoulderL: [Math.PI - 0.3, 0, -0.2], shoulderR: [Math.PI - 0.3, 0, 0.2] });
      applyPose(kid, pose);
      kid.root.updateMatrixWorld(true);
      const mouth = kid.mouth();
      if (t > 1.8 && t < 3.6 && mouth.y < -0.02 && t - last > 0.05) {
        bubbles.emit(mouth);
        last = t;
      }
      if (t < last) last = 0;
    };
  },
};

export const DIVE_PRESETS = { "mergulho-tesouros": mergulhoTesouros, "caca-arco-iris": cacaArcoIris, "salto-pe": saltoPe };
