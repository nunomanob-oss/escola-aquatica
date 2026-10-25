import { Droplets, Target, TrendingUp, Waves } from "lucide-react";

export const SECTION_TEMPLATES = [
  { title: "Aquecimento", rest: "1:00", Icon: Waves },
  { title: "Técnica", rest: "1:30", Icon: Target },
  { title: "Série Principal", rest: "2:00", Icon: TrendingUp },
  { title: "Retorno à Calma", rest: "0:00", Icon: Droplets },
];

export function sectionIcon(title, index) {
  return (
    SECTION_TEMPLATES.find((section) => section.title === title)?.Icon ||
    SECTION_TEMPLATES[index % SECTION_TEMPLATES.length].Icon
  );
}

export function formatSheetDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
}