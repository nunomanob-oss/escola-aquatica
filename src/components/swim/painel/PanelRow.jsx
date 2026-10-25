import React from "react";

// Linha de lista iOS: elemento à esquerda, texto principal/secundário, valor à direita.
// O separador começa depois do recuo, como nas listas do sistema.
export default function PanelRow({ leading, title, subtitle, trailing }) {
  return (
    <div className="flex items-center gap-3 pl-4 min-h-[52px] [&+&>div]:border-t">
      {leading}
      <div className="flex flex-1 min-w-0 items-center gap-3 pr-4 py-2.5 border-[#38383A]">
        <div className="flex-1 min-w-0">
          <p className="text-[17px] leading-snug text-white truncate">{title}</p>
          {subtitle && <p className="text-[13px] leading-snug text-[#8E8E93] truncate">{subtitle}</p>}
        </div>
        {trailing}
      </div>
    </div>
  );
}
