"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DisplayPayload } from "@/types";

const POLL_MS = 30_000;

/**
 * Relógio do painel ancorado no servidor: o tablet pode ficar meses ligado com
 * o relógio errado, então guardamos o offset (servidor − cliente) a cada poll e
 * derivamos tudo dele. `minuteBase` é o epoch do início do minuto corrente do
 * servidor, o que permite converter "HH:MM" de expediente em epoch exato.
 */
export type Clock = { offsetMs: number; minuteBase: number; minutes: number };

export function useDisplayData(date?: string) {
  const [data, setData] = useState<DisplayPayload | null>(null);
  const [clock, setClock] = useState<Clock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const sentAt = Date.now();
    try {
      const res = await fetch(`/api/painel${date ? `?date=${date}` : ""}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as
        | { ok: true; data: DisplayPayload }
        | { ok: false; error: string };
      const receivedAt = Date.now();

      if (!res.ok || !body.ok) {
        setError("error" in body ? body.error : "Falha ao carregar");
        return;
      }

      const serverEpoch = Date.parse(body.data.serverTime.iso);
      // Metade do round-trip compensa a latência da rede.
      const latency = (receivedAt - sentAt) / 2;
      const d = new Date(serverEpoch);
      const intoMinute = d.getSeconds() * 1000 + d.getMilliseconds();

      setData(body.data);
      setClock({
        offsetMs: serverEpoch + latency - receivedAt,
        minuteBase: serverEpoch - intoMinute,
        minutes: body.data.serverTime.minutes,
      });
      setError(null);
    } catch {
      setError("Sem conexão com o servidor");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    // Volta a sincronizar assim que a tela reaparece (kiosk trocando de app).
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", load);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", load);
    };
  }, [load]);

  return { data, clock, error, loading, reload: load };
}

/** Tick local de 1s só para redesenhar o cronômetro. */
export function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** Mantém a tela acesa enquanto o painel estiver visível. */
export function useWakeLock() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    type WakeLockSentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        sentinel = await nav.wakeLock!.request("screen");
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        setActive(true);
      } catch {
        setActive(false);
      }
    };

    // O navegador solta o lock ao esconder a aba; recuperamos ao voltar.
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
      else setActive(false);
    };

    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinel?.release().catch(() => {});
    };
  }, []);

  return active;
}
