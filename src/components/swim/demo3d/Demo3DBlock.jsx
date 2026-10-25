import React, { Suspense, lazy } from "react";
import DetailBlock from "../DetailBlock";
import { DEMO_3D_IDS } from "./presetIds";

const Demo3DViewer = lazy(() => import("./Demo3DViewer"));

// Bloco "Demonstração 3D" da ficha do exercício (só aparece se o exercício tiver demo_3d).
export default function Demo3DBlock({ exercise }) {
  if (!DEMO_3D_IDS.includes(exercise.demo_3d)) return null;

  return (
    <DetailBlock title="Demonstração 3D">
      <Suspense
        fallback={
          <div className="aspect-video rounded-lg bg-[#062b16] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#0d3f22] border-t-[#2fe06b] rounded-full animate-spin" />
          </div>
        }
      >
        <Demo3DViewer presetId={exercise.demo_3d} />
      </Suspense>
      <p className="text-[11px] text-[#9bd0a8]">Arrasta para rodar e aproxima com dois dedos.</p>
    </DetailBlock>
  );
}
