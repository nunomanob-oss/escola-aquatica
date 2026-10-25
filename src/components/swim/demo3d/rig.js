// Boneco articulado (criança com ~1,30 m, estilo plasticina) para as demonstrações 3D.
// Eixos locais: cabeça em +Y, cara em +Z, esquerda em +X. A raiz fica na bacia.
// Ângulos (radianos): ombro/anca X negativo = para a frente, X ±π = braço acima da cabeça;
// abdução: esquerdo +Z, direito -Z; joelho X positivo = fletir; tornozelo X positivo = pé em ponta;
// cabeça X positivo = olhar para baixo.
import * as THREE from "three";

// Estilo "boneco de plasticina": proporções de criança, formas redondas, fato às riscas.
const SKIN = new THREE.MeshPhysicalMaterial({ color: 0xf3c4a2, roughness: 0.55, sheen: 0.4, sheenColor: 0xffd7c2 });
const DARK = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.4 });
const CHEEK = new THREE.MeshStandardMaterial({ color: 0xf29a8c, roughness: 0.8, transparent: true, opacity: 0.55 });
const LENS = new THREE.MeshPhysicalMaterial({ color: 0xaab4c4, roughness: 0.15, metalness: 0.3, clearcoat: 1 });

// Fatos de banho às riscas, escolhidos pela cor da touca (a cor da equipa). Por omissão: azul e laranja.
const SUITS = {
  0x2fe06b: [0x2f86e0, 0xf28a2c],
  0xff6fb1: [0xe2508c, 0x7a5cd6],
  0xffd23f: [0x1fb3a8, 0xffd23f],
  0xe23d3d: [0x2b2f3a, 0xe23d3d],
  0x0a84ff: [0x0a84ff, 0xf5f5f5],
};
const DEFAULT_SUIT = [0x2f86e0, 0xf28a2c];

function stripes([a, b]) {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = `#${(i % 2 ? b : a).toString(16).padStart(6, "0")}`;
    ctx.fillRect(0, i * 8, 8, 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter; // riscas nítidas
  return new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.5, sheen: 0.3 });
}

const mesh = (geo, mat, [x = 0, y = 0, z = 0] = [], [sx = 1, sy = 1, sz = 1] = []) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
};
const sphere = (r, seg = 20) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));

// Membro com dois segmentos de comprimento fixo (seg); o raio só muda o volume.
function limb(parent, at, upper, lower, mat, endMesh) {
  const joint = new THREE.Group();
  joint.position.set(...at);
  joint.add(mesh(new THREE.CapsuleGeometry(upper.r, upper.seg - upper.r, 6, 14), mat, [0, -upper.seg / 2, 0]));
  const mid = new THREE.Group();
  mid.position.y = -upper.seg;
  mid.add(mesh(sphere(lower.r * 1.08, 14), mat));
  mid.add(mesh(new THREE.CapsuleGeometry(lower.r, lower.seg - lower.r, 6, 14), mat, [0, -lower.seg / 2, 0]));
  const end = new THREE.Group();
  end.position.y = -lower.seg;
  end.add(endMesh);
  mid.add(end);
  joint.add(mid);
  parent.add(joint);
  return [joint, mid, end];
}

function buildHead(capMat) {
  const head = new THREE.Group();
  head.position.y = 0.46;
  head.add(mesh(sphere(0.135, 28), SKIN, [0, 0.11, 0]));
  [-1, 1].forEach((side) => {
    head.add(mesh(sphere(0.032, 12), SKIN, [side * 0.132, 0.1, 0.005], [0.55, 1, 0.9])); // orelhas
    head.add(mesh(sphere(0.016, 10), DARK, [side * 0.046, 0.115, 0.126], [1, 1.3, 0.5])); // olhos
    head.add(mesh(sphere(0.02, 10), CHEEK, [side * 0.075, 0.075, 0.112], [1, 0.7, 0.4])); // bochechas
    const lens = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 20), LENS, [side * 0.048, 0.205, 0.095]);
    lens.rotation.x = Math.PI / 2 - 0.75;
    head.add(lens);
    const rim = mesh(new THREE.TorusGeometry(0.037, 0.008, 8, 20), DARK, [side * 0.048, 0.207, 0.098]);
    rim.rotation.x = -0.75;
    head.add(rim);
  });
  head.add(mesh(sphere(0.014, 10), SKIN, [0, 0.092, 0.135])); // nariz
  const smile = mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 16, Math.PI), DARK, [0, 0.07, 0.124]);
  smile.rotation.z = Math.PI;
  head.add(smile);
  // Touca a cobrir o topo e a nuca, deixando a cara à vista; óculos puxados para a testa.
  const cap = mesh(new THREE.SphereGeometry(0.142, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat, [0, 0.115, -0.006]);
  cap.rotation.x = -0.42;
  head.add(cap);
  const strap = mesh(new THREE.TorusGeometry(0.142, 0.007, 8, 40), DARK, [0, 0.17, -0.02]);
  strap.rotation.x = Math.PI / 2 - 0.55;
  head.add(strap);
  return head;
}

export function createSwimmer(color = 0x2fe06b) {
  const capMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.6 });
  const suit = stripes(SUITS[color] || DEFAULT_SUIT);
  const root = new THREE.Group();
  const spine = new THREE.Group();
  root.add(spine);
  spine.add(mesh(new THREE.CapsuleGeometry(0.135, 0.17, 8, 20), suit, [0, 0.13, 0], [1, 1, 0.82])); // tronco com fato
  spine.add(mesh(sphere(0.14, 20), suit, [0, 0.0, 0], [1, 0.75, 0.85])); // bacia
  spine.add(mesh(sphere(0.125, 20), SKIN, [0, 0.33, 0], [1.05, 0.62, 0.8])); // ombros e peito
  spine.add(mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.08, 14), SKIN, [0, 0.42, 0])); // pescoço
  spine.add(buildHead(capMat));

  const hand = mesh(sphere(0.042, 14), SKIN, [0, -0.02, 0], [0.9, 1.25, 0.6]);
  const foot = mesh(new THREE.CapsuleGeometry(0.042, 0.08, 6, 12), SKIN, [0, -0.015, 0.045], [1, 1, 0.8]);
  foot.rotation.x = Math.PI / 2;
  const arm = { r: 0.048, seg: 0.22 };
  const fore = { r: 0.043, seg: 0.2 };
  const thigh = { r: 0.07, seg: 0.31 };
  const shin = { r: 0.054, seg: 0.29 };

  const [shoulderL, elbowL, wristL] = limb(spine, [0.16, 0.37, 0], arm, fore, SKIN, hand);
  const [shoulderR, elbowR, wristR] = limb(spine, [-0.16, 0.37, 0], arm, fore, SKIN, hand.clone());
  const [hipL, kneeL, ankleL] = limb(root, [0.075, -0.02, 0], thigh, shin, SKIN, foot);
  const [hipR, kneeR, ankleR] = limb(root, [-0.075, -0.02, 0], thigh, shin, SKIN, foot.clone());
  const head = spine.children.find((c) => c.isGroup);

  const joints = { spine, head, shoulderL, elbowL, wristL, shoulderR, elbowR, wristR, hipL, kneeL, ankleL, hipR, kneeR, ankleR };
  return { root, joints, mouth: () => head.localToWorld(new THREE.Vector3(0, 0.07, 0.13)) };
}

// Pose: { pos:[x,y,z], quat:Quaternion, spine, head:[x,y,z], shoulderL:[x,y,z], elbowL, hipL:[x,y,z], kneeL, ankleL, ... }
const VEC_JOINTS = ["head", "shoulderL", "shoulderR", "hipL", "hipR"];
const X_JOINTS = ["spine", "elbowL", "elbowR", "kneeL", "kneeR", "ankleL", "ankleR"];

export function applyPose(swimmer, pose) {
  const { root, joints } = swimmer;
  if (pose.pos) root.position.set(...pose.pos);
  if (pose.quat) root.quaternion.copy(pose.quat);
  VEC_JOINTS.forEach((k) => joints[k].rotation.set(...(pose[k] || [0, 0, 0])));
  X_JOINTS.forEach((k) => joints[k].rotation.set(pose[k] || 0, 0, 0));
}

// Mistura duas poses (k entre 0 e 1).
export function mixPose(a, b, k) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((key) => {
    const va = a[key];
    const vb = b[key];
    if (key === "quat") out.quat = (va || new THREE.Quaternion()).clone().slerp(vb || new THREE.Quaternion(), k);
    else if (Array.isArray(va) || Array.isArray(vb)) {
      const x = va || [0, 0, 0];
      const y = vb || [0, 0, 0];
      out[key] = x.map((v, i) => v + (y[i] - v) * k);
    } else out[key] = (va || 0) + ((vb || 0) - (va || 0)) * k;
  });
  return out;
}

// Orientação a partir da direção da cabeça e da cara (em coordenadas do mundo).
export function orient(headDir, faceDir) {
  const up = new THREE.Vector3(...headDir).normalize();
  const front = new THREE.Vector3(...faceDir).normalize();
  const right = new THREE.Vector3().crossVectors(up, front);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, front));
}
