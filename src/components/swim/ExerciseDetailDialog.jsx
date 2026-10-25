import React, { useState } from "react";
import { entities } from "@/lib/entities";
import { Copy, Dumbbell, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddToTrainingDialog from "./AddToTrainingDialog";
import ExerciseInfographic from "./ExerciseInfographic";
import DetailBlock from "./DetailBlock";
import ExerciseFormatBlock from "./ExerciseFormatBlock";
import ExerciseListBlock from "./ExerciseListBlock";
import Demo3DBlock from "./demo3d/Demo3DBlock";
import { EQUIPMENT_ICONS } from "./exerciseMeta";

function embedUrl(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

const Block = DetailBlock;

function MediaBlock({ exercise }) {
  const url = exercise.video_url;

  if (!url) {
    return <p className="text-[11px] text-[#9bd0a8]">Sem vídeo associado a este exercício.</p>;
  }

  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/.test(url);

  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black">
      {isEmbed ? (
        <iframe
          src={embedUrl(url)}
          title={exercise.title}
          className="w-full h-full"
          allowFullScreen
        />
      ) : (
        <video
          src={url}
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

export default function ExerciseDetailDialog({ exercise, onClose, levels, onDuplicated }) {
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  if (!exercise) return null;

  const styles = exercise.style || [];
  const athleteLevels = exercise.level || [];
  const equipment = exercise.equipment_required || [];
  const focusPoints = exercise.focus_points || [];
  const tags = exercise.tags || [];
  const rating = Number(exercise.difficulty_rating) || 0;

  const handleDuplicate = async () => {
    setDuplicating(true);
    const copy = { ...exercise };
    delete copy.id;
    delete copy.created_date;
    delete copy.updated_date;
    delete copy.created_by_id;

    await entities.Exercise.create({
      ...copy,
      code: undefined,
      title: `${exercise.title} (personalizado)`,
      is_custom: true,
      is_example: false,
    });

    setDuplicating(false);
    onClose();
    onDuplicated();
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto bg-[#0d3f22] border-[#186a35] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-left text-white">{exercise.title}</DialogTitle>
            <DialogDescription className="text-left text-[#9bd0a8]">
              {exercise.code ? `${exercise.code} · ` : ""}
              {exercise.category || "Sem categoria"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            {styles.map((style) => (
              <span
                key={style}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2fe06b]/20 text-[#2fe06b]"
              >
                {style}
              </span>
            ))}
            {athleteLevels.map((level) => (
              <span
                key={level}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#d8f0da]"
              >
                {level}
              </span>
            ))}
            {exercise.is_custom && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300">
                Personalizado
              </span>
            )}
          </div>

          <MediaBlock exercise={exercise} />

          <Demo3DBlock exercise={exercise} />

          <ExerciseInfographic key={exercise.id} exercise={exercise} />

          {exercise.description && (
            <Block title="Execução Técnica">
              <p className="text-sm text-[#d8f0da] leading-relaxed whitespace-pre-line">
                {exercise.description}
              </p>
            </Block>
          )}

          {exercise.primary_objective && (
            <Block title="Objetivo Principal">
              <p className="text-sm text-[#d8f0da] leading-relaxed">
                {exercise.primary_objective}
              </p>
            </Block>
          )}

          <ExerciseFormatBlock exercise={exercise} />

          <ExerciseListBlock title="Passo a Passo" items={exercise.instructions} numbered />

          {exercise.common_mistakes && (
            <Block title="Erros Comuns e Correções">
              <p className="text-sm text-[#d8f0da] leading-relaxed whitespace-pre-line">
                {exercise.common_mistakes}
              </p>
            </Block>
          )}

          {(exercise.coaching_cues || focusPoints.length > 0) && (
            <Block title="Gatilhos do Treinador">
              {exercise.coaching_cues && (
                <p className="text-base font-semibold text-[#2fe06b] leading-relaxed">
                  {exercise.coaching_cues}
                </p>
              )}
              {focusPoints.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {focusPoints.map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-[#d8f0da]">
                      <span className="text-[#2fe06b]">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          )}

          <ExerciseListBlock title="Variações" items={exercise.variations} />

          {(equipment.length > 0 || rating > 0) && (
            <Block title="Equipamento e Dificuldade">
              <div className="flex flex-wrap gap-2">
                {equipment.map((item) => {
                  const Icon = EQUIPMENT_ICONS[item] || Dumbbell;
                  return (
                    <span
                      key={item}
                      className="flex items-center gap-1.5 text-[11px] bg-[#0d3f22] px-2 py-1 rounded-full text-[#d8f0da]"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#2fe06b]" />
                      {item}
                    </span>
                  );
                })}
              </div>
              {rating > 0 && (
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`w-2 h-2 rounded-full ${
                        n <= rating ? "bg-[#2fe06b]" : "bg-white/20"
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-[#9bd0a8] ml-1">Dificuldade {rating}/5</span>
                </div>
              )}
            </Block>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#9bd0a8]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              onClick={() => setTrainingOpen(true)}
              className="flex-1 bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar ao Treino
            </Button>
            <Button
              variant="ghost"
              onClick={handleDuplicate}
              disabled={duplicating}
              className="flex-1 text-[#d8f0da] hover:bg-[#186a35] hover:text-white"
            >
              <Copy className="w-4 h-4 mr-1" />
              {duplicating ? "A duplicar…" : "Duplicar como personalizado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddToTrainingDialog
        key={exercise.id}
        exercise={exercise}
        open={trainingOpen}
        onOpenChange={setTrainingOpen}
        levels={levels}
      />
    </>
  );
}