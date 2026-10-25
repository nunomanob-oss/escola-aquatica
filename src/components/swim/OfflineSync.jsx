import { useEffect } from "react";
import { flushQueue } from "./offlineQueue";

// Não desenha nada: envia a fila de escrita ao arrancar e sempre que a rede volta.
export default function OfflineSync() {
  useEffect(() => {
    const flush = () => {
      flushQueue().catch(() => {});
    };
    flush();
    window.addEventListener("online", flush);
    const timer = setInterval(flush, 60000);
    return () => {
      window.removeEventListener("online", flush);
      clearInterval(timer);
    };
  }, []);

  return null;
}
