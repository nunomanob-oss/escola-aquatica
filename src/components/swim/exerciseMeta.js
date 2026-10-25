import {
  Anchor,
  Circle,
  CircleDashed,
  CircleDot,
  Grip,
  Hand,
  Link,
  Minus,
  RectangleHorizontal,
  Ruler,
  Square,
  Timer,
  Waves,
  Wind,
} from "lucide-react";

export const STYLE_OPTIONS = [
  "Crol",
  "Costas",
  "Bruços",
  "Mariposa",
  "Quatro Estilos (IM)",
  "Genérico",
];

export const CATEGORY_OPTIONS = [
  "Técnica / Drills",
  "Pernas (Kick)",
  "Braços (Pull)",
  "Partidas e Viragens",
  "Posição do Corpo / Flutuação",
  "Respiração",
  "Resistência / Aeróbico",
  "Velocidade / Potência",
  "Adaptação / Confiança na Água",
  "Jogos / Lúdico",
];

export const ATHLETE_LEVEL_OPTIONS = [
  "Iniciação / Adaptação",
  "Aprendizagem / Média",
  "Aperfeiçoamento",
  "Alto Rendimento",
  "Master",
];

export const EQUIPMENT_OPTIONS = [
  "Nenhum",
  "Prancha",
  "PULL-BUOY",
  "Barbatanas",
  "Pás",
  "Tubo Frontal (Snorkel)",
  "Elástico",
  "Cinto de Tração",
  "Esparguete",
  "Arcos de mergulho",
  "Bastões de mergulho",
  "Bola",
  "Tapete flutuante",
  "Metrónomo (Tempo Trainer)",
];

export const EQUIPMENT_ICONS = {
  Nenhum: Minus,
  Prancha: Square,
  "PULL-BUOY": Circle,
  Barbatanas: Waves,
  Pás: Hand,
  "Tubo Frontal (Snorkel)": Wind,
  Elástico: Link,
  "Cinto de Tração": Grip,
  Esparguete: Ruler,
  "Arcos de mergulho": CircleDot,
  "Bastões de mergulho": Anchor,
  Bola: CircleDashed,
  "Tapete flutuante": RectangleHorizontal,
  "Metrónomo (Tempo Trainer)": Timer,
};

// Blocos de treino: os mesmos nomes das fichas de treino.
export const TRAINING_BLOCKS = [
  "Aquecimento",
  "Técnica",
  "Série Principal",
  "Pernas",
  "Braços",
  "Velocidade",
  "Retorno à Calma",
  "Jogos",
];

// Nível do atleta correspondente a cada turma (os exercícios da biblioteca técnica são por nível).
export const TURMA_LEVEL = {
  A1: "Iniciação / Adaptação",
  "A1+": "Iniciação / Adaptação",
  A2: "Iniciação / Adaptação",
  "A2+": "Iniciação / Adaptação",
  B1: "Aprendizagem / Média",
  B2: "Aprendizagem / Média",
  C: "Aperfeiçoamento",
  D: "Aperfeiçoamento",
};

export const INTENSITY_OPTIONS = ["Baixa", "Moderada", "Alta", "Máxima"];

// Registos antigos ainda podem trazer "Crawl"; a interface mostra sempre "Crol".
export function normalizeExercise(exercise) {
  if (!Array.isArray(exercise.style) || !exercise.style.includes("Crawl")) return exercise;
  return { ...exercise, style: exercise.style.map((s) => (s === "Crawl" ? "Crol" : s)) };
}
