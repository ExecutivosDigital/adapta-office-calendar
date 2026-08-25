"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Clock3,
  Maximize2,
  Minimize2,
  MonitorSmartphone,
  Play,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisplayEntry, DisplayRoom } from "@/types";
import { useDisplayData, useTick, useWakeLock, type Clock } from "./use-display";

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Epoch exato de um "HH:MM" do expediente, ancorado no relógio do servidor. */
function epochOf(hhmm: string, clock: Clock) {
  return clock.minuteBase + (toMinutes(hhmm) - clock.minutes) * 60_000;
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function formatWeekday(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .toUpperCase();
}

function formatLongDate(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();
}

export function PainelClient({
  initialSlug,
  wifiSsid,
}: {
  initialSlug?: string;
  wifiSsid?: string;
}) {
  const { data, clock, error, loading, reload } = useDisplayData();
  useTick(1000);
  const wakeLockActive = useWakeLock();
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const rooms = useMemo(() => data?.rooms ?? [], [data]);
  const focused: DisplayRoom | null = useMemo(() => {
    if (!rooms.length) return null;
    return rooms.find((r) => r.slug === slug) ?? rooms[0];
  }, [rooms, slug]);

  // O poll de 30s sozinho deixaria o painel até meio minuto mostrando
  // "00:00:00": recarregamos exatamente na virada da próxima reunião.
  useEffect(() => {
    if (!clock || !rooms.length) return;
    const now = Date.now() + clock.offsetMs;
    const boundaries = rooms
      .flatMap((room) => room.reservations.flatMap((r) => [r.start_time, r.end_time]))
      .map((t) => epochOf(t, clock))
      .filter((epoch) => epoch > now);
    if (!boundaries.length) return;
    const wait = Math.min(...boundaries) - now + 1_500;
    const id = setTimeout(reload, wait);
    return () => clearTimeout(id);
  }, [rooms, clock, reload]);

  if (loading && !data) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080A] text-white/50">
        <p className="animate-pulse text-lg tracking-widest">CARREGANDO PAINEL…</p>
      </main>
    );
  }

  if (!data || !clock || !focused) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#08080A] text-white/70">
        <WifiOff className="h-10 w-10 text-white/30" />
        <p className="text-lg">{error ?? "Nenhuma sala ativa para exibir."}</p>
        <p className="text-sm text-white/35">A tela tenta reconectar sozinha.</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#08080A] text-white lg:flex-row">
      {/* ── Agenda ─────────────────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-1 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
        <header className="flex items-center gap-5 px-8 pb-5 pt-7">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2">
            <Image
              src="/logo-mini.png"
              alt="Adapta Offices"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-[clamp(1.75rem,3.2vw,2.75rem)] font-bold leading-none tracking-tight">
              AGENDA DE SALAS
            </h1>
            <p className="mt-2 text-[clamp(0.85rem,1.2vw,1.05rem)] text-white/45">
              Planeje. Conecte. Realize.
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-4">
          {rooms.map((room) => (
            <RoomAgenda
              key={room.id}
              room={room}
              focused={room.id === focused.id}
              onSelect={() => setSlug(room.slug)}
            />
          ))}
        </div>

        <footer className="grid grid-cols-3 gap-4 border-t border-white/10 px-8 py-4">
          <FooterItem
            icon={<Clock3 className="h-5 w-5" />}
            label="Horário de funcionamento"
            value={`${data.business.opening} – ${data.business.closing}`}
          />
          <FooterItem
            icon={<Users className="h-5 w-5" />}
            label={focused.location ?? "Capacidade"}
            value={`${focused.capacity} pessoas`}
          />
          <FooterItem
            icon={
              error ? (
                <WifiOff className="h-5 w-5 text-amber-400" />
              ) : (
                <Wifi className="h-5 w-5" />
              )
            }
            label={error ? "Sem sincronizar" : "Wi-Fi"}
            value={
              error
                ? `Última leitura ${data.serverTime.time}`
                : (wifiSsid ?? "ADAPTA_COWORKING")
            }
          />
        </footer>
      </section>

      {/* ── Cronômetro ─────────────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-1 flex-col items-center justify-between px-8 py-7 lg:max-w-[46%]">
        <div className="flex items-center gap-4">
          <CalendarDays className="h-9 w-9 text-white/35" />
          <div>
            <p className="text-[clamp(1.4rem,2.6vw,2.25rem)] font-bold leading-none tracking-tight">
              {formatWeekday(data.date)}
            </p>
            <p className="mt-1.5 text-[clamp(0.75rem,1.1vw,1rem)] tracking-wide text-white/45">
              {formatLongDate(data.date)}
            </p>
          </div>
        </div>

        <CountdownDial room={focused} clock={clock} closing={data.business.closing} />

        <div className="flex w-full flex-col items-center gap-3">
          <p className="text-center text-[clamp(0.9rem,1.4vw,1.15rem)] font-medium text-white/70">
            {focused.name}
          </p>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold tracking-wide text-white/70 transition-colors hover:bg-white/10"
          >
            {fullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
            {fullscreen ? "SAIR DA TELA CHEIA" : "TELA CHEIA"}
          </button>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/25">
            <MonitorSmartphone className="h-3.5 w-3.5" />
            {wakeLockActive ? "Tela sempre ativa" : "Modo painel"}
          </p>
        </div>
      </section>
    </main>
  );
}

function RoomAgenda({
  room,
  focused,
  onSelect,
}: {
  room: DisplayRoom;
  focused: boolean;
  onSelect: () => void;
}) {
  const visible = room.reservations.filter((r) => r.state !== "done");
  const done = room.reservations.length - visible.length;

  return (
    <div className="mb-6 last:mb-0">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 border-b border-white/10 py-3 text-left"
      >
        <Users className={cn("h-6 w-6", focused ? "text-brand-400" : "text-white/35")} />
        <span
          className={cn(
            "text-[clamp(1rem,1.7vw,1.4rem)] font-semibold uppercase tracking-wide",
            focused ? "text-white" : "text-white/55",
          )}
        >
          {room.name}
        </span>
        <StatusDot status={room.status} />
        {done > 0 && (
          <span className="ml-auto text-[11px] uppercase tracking-widest text-white/25">
            {done} encerrada{done > 1 ? "s" : ""}
          </span>
        )}
      </button>

      {visible.length === 0 ? (
        <p className="py-4 text-[clamp(0.85rem,1.2vw,1.05rem)] text-white/35">
          Sem reservas para o restante do dia — sala livre.
        </p>
      ) : (
        <ul>
          {visible.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: DisplayEntry }) {
  const running = entry.state === "running";
  return (
    <li className="flex items-center gap-5 border-b border-white/[0.06] py-3 last:border-b-0">
      <span
        className={cn(
          "w-[clamp(7.5rem,11vw,10rem)] shrink-0 tabular-nums text-[clamp(0.9rem,1.35vw,1.15rem)]",
          running ? "text-white" : "text-white/60",
        )}
      >
        {entry.start_time} – {entry.end_time}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[clamp(0.95rem,1.4vw,1.2rem)]",
          running ? "font-medium text-white" : "text-white/75",
        )}
        title={`${entry.title} · ${entry.customer_name}`}
      >
        {entry.title}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full border px-3.5 py-1.5 text-[clamp(0.6rem,0.85vw,0.75rem)] font-semibold uppercase tracking-wider",
          running
            ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
            : "border-white/[0.12] bg-white/[0.04] text-white/45",
        )}
      >
        {running ? "Em andamento" : "Agendado"}
      </span>
    </li>
  );
}

function StatusDot({ status }: { status: DisplayRoom["status"] }) {
  const map = {
    occupied: { color: "bg-brand-500", label: "Ocupada" },
    free: { color: "bg-emerald-400", label: "Livre" },
    closed: { color: "bg-white/30", label: "Fora do horário" },
  } as const;
  const { color, label } = map[status];
  return (
    <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function FooterItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/35">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-widest text-white/35">{label}</p>
        <p className="truncate text-[clamp(0.75rem,1vw,0.95rem)] font-medium text-white/80">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Anel de progresso + contagem regressiva. Sala ocupada → tempo até o fim da
 * reunião em curso; sala livre → tempo até a próxima reserva. Sem próxima
 * reserva, mostra a janela livre até o fechamento.
 */
function CountdownDial({
  room,
  clock,
  closing,
}: {
  room: DisplayRoom;
  clock: Clock;
  closing: string;
}) {
  const now = Date.now() + clock.offsetMs;
  const occupied = room.status === "occupied" && room.current !== null;

  const targetEpoch = room.target ? epochOf(room.target.time, clock) : null;

  // Início da janela atual, para o preenchimento do anel.
  const windowStart = occupied
    ? epochOf(room.current!.start_time, clock)
    : (() => {
        const previousEnd = room.reservations
          .filter((r) => r.state === "done")
          .at(-1)?.end_time;
        return previousEnd ? epochOf(previousEnd, clock) : null;
      })();

  const remaining = targetEpoch !== null ? targetEpoch - now : null;
  const total =
    targetEpoch !== null && windowStart !== null ? targetEpoch - windowStart : null;
  const progress =
    remaining !== null && total !== null && total > 0
      ? Math.min(1, Math.max(0, 1 - remaining / total))
      : 0;

  const accent = occupied ? "#F76F19" : "#34D399";
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  const label = occupied
    ? "Em andamento"
    : room.status === "closed"
      ? "Fora do horário"
      : "Sala livre";

  const caption = occupied
    ? `Termina às ${room.current!.end_time} · ${room.current!.title}`
    : room.next
      ? `Próxima às ${room.next.start_time} · ${room.next.title}`
      : `Livre até ${room.freeUntil ?? closing}`;

  return (
    <div className="relative flex w-full max-w-[min(70vh,34rem)] flex-col items-center">
      <div className="relative w-full">
        <svg viewBox="0 0 100 100" className="w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * progress}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p
            className={cn(
              "tabular-nums text-[clamp(2.5rem,7.5vw,5.5rem)] font-bold leading-none tracking-tight",
              remaining === null && "text-white/40",
            )}
          >
            {remaining !== null ? formatCountdown(remaining) : "--:--:--"}
          </p>
          <span
            className="flex items-center gap-2 rounded-full border px-5 py-2 text-[clamp(0.65rem,1vw,0.85rem)] font-semibold uppercase tracking-wider"
            style={{
              borderColor: `${accent}55`,
              backgroundColor: `${accent}1f`,
              color: accent,
            }}
          >
            <Play className="h-4 w-4" />
            {label}
          </span>
        </div>
      </div>

      <p className="mt-6 max-w-full truncate px-4 text-center text-[clamp(0.8rem,1.2vw,1.05rem)] text-white/50">
        {caption}
      </p>
    </div>
  );
}
