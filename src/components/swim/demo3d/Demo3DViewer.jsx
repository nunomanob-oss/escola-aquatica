import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pause, Play } from "lucide-react";
import { buildPool } from "./pool";
import { createSwimmer } from "./rig";
import { makeBubbles } from "./props";
import { PRESETS } from "./presets";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Carregado só quando se abre uma ficha com demonstração 3D (o three.js fica num ficheiro à parte).
export default function Demo3DViewer({ presetId }) {
  const holder = useRef(null);
  const playingRef = useRef(!reducedMotion());
  const [playing, setPlaying] = useState(playingRef.current);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    const preset = PRESETS[presetId];
    const el = holder.current;
    if (!preset || !el) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 60);
    // Câmara mais perto da criança (zoom < 1); cenas com várias crianças ou material usam zoom próprio.
    const target = new THREE.Vector3(...preset.target);
    const offset = new THREE.Vector3(...preset.camera).sub(target).multiplyScalar(preset.zoom ?? 0.68);
    camera.position.copy(target).add(offset);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 8;
    controls.update();

    const pool = buildPool(scene);
    const bubbles = makeBubbles(scene);
    const swimmer = (color) => {
      const s = createSwimmer(color);
      scene.add(s.root);
      return s;
    };
    const update = preset.setup({ scene, swimmer, bubbles });

    const resize = () => {
      const w = el.clientWidth;
      const h = Math.round((w * 9) / 16);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    // Sem movimento (preferência do sistema), fica parado num momento representativo.
    let t = playingRef.current ? 0 : (preset.captions[1]?.[0] ?? 0.4) + 0.6;
    let shown = "";
    let frame;
    const clock = new THREE.Clock();
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible) return;
      if (playingRef.current) t = (t + dt) % preset.duration;
      update(t, dt);
      pool.update(t);
      bubbles.update(playingRef.current ? dt : 0);
      controls.update();
      renderer.render(scene, camera);
      const current = [...preset.captions].reverse().find(([at]) => t >= at)?.[1] || "";
      if (current !== shown) setCaption((shown = current));
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        obj.geometry?.dispose();
        [].concat(obj.material || []).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [presetId]);

  const toggle = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  return (
    <>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#062b16] touch-none">
        <div ref={holder} className="absolute inset-0" />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar demonstração" : "Reproduzir demonstração"}
          className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-black/70 text-[#2fe06b] flex items-center justify-center"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
      <p className="mt-2 min-h-[2.6em] text-sm leading-snug text-[#d8f0da]" aria-live="polite">
        {caption}
      </p>
    </>
  );
}
