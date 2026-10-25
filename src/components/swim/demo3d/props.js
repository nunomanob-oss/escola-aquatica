// Material da aula: prancha, esparguete, arcos, tapete flutuante e bolhas de ar.
import * as THREE from "three";

const foam = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

export function makeBoard() {
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.035, 0.3), foam(0xffd23f));
  return board;
}

export function makeNoodle() {
  const geo = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 14);
  geo.rotateZ(Math.PI / 2);
  return new THREE.Mesh(geo, foam(0xff6fb1));
}

export function makeRing(color) {
  const geo = new THREE.TorusGeometry(0.11, 0.025, 10, 28);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
}

export function makeMat() {
  return new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.9), foam(0x3fbf5a));
}

// Bolhas que sobem da boca até à superfície.
export function makeBubbles(scene, count = 60) {
  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.018, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
    count
  );
  mesh.renderOrder = 3;
  scene.add(mesh);
  const items = Array.from({ length: count }, () => ({ alive: false, p: new THREE.Vector3(), age: 0 }));
  const matrix = new THREE.Matrix4();
  let next = 0;
  return {
    emit(position) {
      const b = items[next];
      next = (next + 1) % count;
      b.alive = true;
      b.age = 0;
      b.p.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05));
    },
    update(dt) {
      items.forEach((b, i) => {
        if (b.alive) {
          b.age += dt;
          b.p.y += dt * 0.45;
          b.p.x += Math.sin(b.age * 9 + i) * dt * 0.05;
          if (b.p.y > 0) b.alive = false;
        }
        const s = b.alive ? 1 : 0;
        matrix.makeScale(s, s, s).setPosition(b.p);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    clear() {
      items.forEach((b) => (b.alive = false));
    },
  };
}
