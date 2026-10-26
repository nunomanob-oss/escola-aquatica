import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

// Regressão (mais fácil) e progressão (mais difícil) de um exercício exemplo.
export default function ProgressionSteps({ exercise }) {
  const steps = [
    exercise.regression && { label: "Regressão", hint: "mais fácil", text: exercise.regression, Icon: ArrowDownRight },
    exercise.progression && { label: "Progressão", hint: "mais difícil", text: exercise.progression, Icon: ArrowUpRight },
  ].filter(Boolean);

  return (
    <ul className="space-y-2">
      {steps.map(({ label, hint, text, Icon }) => (
        <li key={label} className="flex gap-2 text-sm text-[#d8f0da] leading-relaxed">
          <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[#2fe06b]" />
          <span>
            <span className="font-semibold text-white">{label}</span>
            <span className="text-[11px] text-[#9bd0a8]"> ({hint})</span>: {text}
          </span>
        </li>
      ))}
    </ul>
  );
}
