// Piscina: fundo e parede com azulejos, cais, pista e água a ondular.
// A superfície da água está em y = 0, o fundo em y = FLOOR e a parede em x = WALL_X.
import * as THREE from "three";

export const FLOOR = -0.95;
export const WALL_X = -2.85;
export const DECK_Y = 0.3;

function tileTexture(base, line, repeat) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildPool(scene) {
  scene.background = new THREE.Color(0x062b16);
  scene.add(new THREE.HemisphereLight(0xeaf8ff, 0x2a6f7d, 1.25));
  // Luz principal com sombra suave no fundo da piscina, mais uma luz de contorno.
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.9);
  sun.position.set(2.5, 6, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4, bottom: -4, near: 1, far: 16 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xbfe9ff, 0.7);
  rim.position.set(-3, 2.5, -4);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 6),
    new THREE.MeshStandardMaterial({ map: tileTexture("#bfe8f2", "#8fd0e0", [32, 24]), roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(1.15, FLOOR, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const lane = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x1d3f75 }));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(1.15, FLOOR + 0.005, -1.4);
  scene.add(lane);

  const wallTiles = tileTexture("#e9f6fa", "#b9dfe9", [10, 5]);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, DECK_Y - FLOOR, 6), new THREE.MeshStandardMaterial({ map: wallTiles }));
  wall.position.set(WALL_X - 0.15, (DECK_Y + FLOOR) / 2, 0);
  wall.receiveShadow = true;
  scene.add(wall);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c7, roughness: 0.95 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 6), deckMat);
  deck.position.set(WALL_X - 0.6, DECK_Y - 0.04, 0);
  scene.add(deck);

  // Parede do fundo, para a piscina ficar fechada.
  const backTiles = tileTexture("#e9f6fa", "#b9dfe9", [26, 5]);
  const back = new THREE.Mesh(new THREE.BoxGeometry(8.3, DECK_Y - FLOOR, 0.3), new THREE.MeshStandardMaterial({ map: backTiles }));
  back.position.set(1.15 - 0.15, (DECK_Y + FLOOR) / 2, -3.15);
  scene.add(back);
  const backDeck = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 1.2), deckMat);
  back.add(backDeck);
  backDeck.position.set(-0.45, (DECK_Y - FLOOR) / 2 - 0.04, -0.45);

  // Linha da água nas paredes: mostra onde fica a superfície.
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x2a8fa8 });
  const sideLine = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.035), lineMat);
  sideLine.rotation.y = Math.PI / 2;
  sideLine.position.set(WALL_X + 0.002, 0, 0);
  const backLine = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.035), lineMat);
  backLine.position.set(1.15, 0, -2.998);
  scene.add(sideLine, backLine);

  // Pista flutuante (boias vermelhas e brancas) ao longo do fundo da cena.
  const buoyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12);
  buoyGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 52; i++) {
    const color = Math.floor(i / 4) % 2 ? 0xffffff : 0xe23d3d;
    const buoy = new THREE.Mesh(buoyGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
    buoy.position.set(WALL_X + 0.1 + i * 0.14, 0.02, -2.6);
    scene.add(buoy);
  }

  const waterGeo = new THREE.PlaneGeometry(8, 6, 48, 36);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({
      color: 0x1fa3c8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.5,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  water.position.x = 1.15;
  water.renderOrder = 2;
  scene.add(water);

  const base = waterGeo.attributes.position.array.slice();
  return {
    // Ondulação suave da superfície.
    update(t) {
      const pos = waterGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        const z = base[i * 3 + 2];
        pos.array[i * 3 + 1] = Math.sin(x * 1.7 + t * 1.6) * 0.012 + Math.cos(z * 2.1 + t * 1.2) * 0.01;
      }
      pos.needsUpdate = true;
    },
  };
}
