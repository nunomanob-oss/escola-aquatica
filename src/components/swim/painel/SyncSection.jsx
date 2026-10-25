import React, { useState } from "react";
import { CheckCircle2, CloudOff, RefreshCw } from "lucide-react";
import PanelSection from "./PanelSection";
import { flushQueue } from "../offlineQueue";

// Estado da fila de alterações feitas sem rede.
export default function SyncSection({ pending, online, onSynced }) {
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    await flushQueue().catch(() => {});
    setSending(false);
    onSynced();
  };

  const synced = pending === 0;
  const Icon = synced ? CheckCircle2 : online ? RefreshCw : CloudOff;
  const color = synced ? "#30D158" : "#FF9F0A";
  const title = synced ? "Tudo sincronizado" : `${pending} ${pending === 1 ? "alteração" : "alterações"} por enviar`;
  const detail = synced
    ? "O que fizeres sem rede é enviado assim que a ligação voltar."
    : online
      ? "Ainda não foram enviadas. Podes enviá-las agora."
      : "Sem rede. São enviadas quando a ligação voltar.";

  return (
    <PanelSection title="Sincronização">
      <div className="flex items-start gap-3 p-4">
        <Icon className="w-7 h-7 shrink-0" style={{ color }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] text-white">{title}</p>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">{detail}</p>
          {!synced && online && (
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="mt-3 h-9 px-4 rounded-full bg-[#2C2C2E] text-[15px] font-semibold text-[#0A84FF] active:opacity-60 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
            >
              {sending ? "A enviar…" : "Enviar agora"}
            </button>
          )}
        </div>
      </div>
    </PanelSection>
  );
}
