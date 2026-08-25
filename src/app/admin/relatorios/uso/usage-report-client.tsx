"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, CalendarDays, Clock3, Download, LayoutDashboard, LogOut, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/admin/metric-card";
import { getUsageReport, signOutAdmin } from "@/server/actions/admin";
import type { UsageReport } from "@/lib/api-client";
import type { Room } from "@/types";

export function UsageReportClient({
  rooms,
  initialReport,
}: {
  rooms: Room[];
  initialReport: UsageReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [roomId, setRoomId] = useState("all");
  const [isPending, startTransition] = useTransition();

  function refresh() {
    if (from && to && from > to) {
      toast.error("A data inicial deve ser anterior à data final.");
      return;
    }
    startTransition(async () => {
      try {
        setReport(await getUsageReport({ from: from || undefined, to: to || undefined, room_id: roomId === "all" ? undefined : roomId }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar o relatório.");
      }
    });
  }

  // Usa os filtros digitados, mesmo que "Atualizar relatório" ainda não tenha
  // sido clicado — é o que a pessoa espera ao baixar logo após trocar as datas.
  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (roomId !== "all") params.set("room_id", roomId);
    const query = params.toString();
    return `/admin/relatorios/uso/export${query ? `?${query}` : ""}`;
  }, [from, to, roomId]);

  const invalidRange = Boolean(from && to && from > to);

  const maxDayMinutes = Math.max(...report.byDay.map((item) => item.minutes), 1);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200/70 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.gif" alt="Adapta Offices" width={36} height={45} className="rounded-md" />
            <div><p className="text-sm font-semibold text-stone-900">Adapta Offices</p><p className="text-xs text-stone-500">Relatório de utilização</p></div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild><Link href="/admin/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/admin/usuarios"><Users className="mr-1.5 h-4 w-4" />Usuários</Link></Button>
            <form action={signOutAdmin}><Button variant="ghost" size="sm" type="submit"><LogOut className="mr-1.5 h-4 w-4" />Sair</Button></form>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6 sm:py-10">
        <div>
          <div className="flex items-center gap-2 text-brand-700"><BarChart3 className="h-5 w-5" /><span className="text-sm font-semibold">Indicadores de uso</span></div>
          <h1 className="mt-2 text-2xl font-semibold text-stone-900">Relatório de utilização</h1>
          <p className="text-sm text-stone-500">Veja quantas seleções foram feitas, quantos minutos foram usados e quando as salas são mais procuradas.</p>
        </div>

        <section className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <div className="space-y-1.5"><Label htmlFor="usage-from">De</Label><Input id="usage-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="usage-to">Até</Label><Input id="usage-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Sala</Label><Select value={roomId} onValueChange={setRoomId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as salas</SelectItem>{rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" asChild={!invalidRange} disabled={invalidRange}>
              {invalidRange ? (
                <span><Download className="mr-1.5 h-4 w-4" />Baixar Excel</span>
              ) : (
                <a href={exportHref}><Download className="mr-1.5 h-4 w-4" />Baixar Excel</a>
              )}
            </Button>
            <Button onClick={refresh} disabled={isPending}>{isPending ? "Atualizando..." : "Atualizar relatório"}</Button>
          </div>
          <p className="mt-2 text-right text-xs text-stone-500">
            A planilha traz uma aba por sala, com resumo, quem usou, horários de pico e todas as reservas do período.
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Reservas confirmadas" value={report.summary.confirmedReservations} icon={CalendarDays} tone="brand" />
          <MetricCard label="Seleções confirmadas" value={report.summary.confirmedSelections} icon={BarChart3} tone="amber" />
          <MetricCard label="Minutos utilizados" value={formatMinutes(report.summary.totalMinutesUsed)} icon={Clock3} tone="emerald" />
          <MetricCard label="Média por reserva" value={formatMinutes(report.summary.averageMinutes)} icon={Clock3} tone="stone" />
          <MetricCard label="Canceladas" value={report.summary.cancelledReservations} icon={CalendarDays} tone="stone" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900"><Building2 className="h-4 w-4 text-brand-600" />Uso por sala</h2>
            <div className="mt-4 space-y-3">
              {report.byRoom.length === 0 ? <Empty /> : report.byRoom.map((item) => <div key={item.roomId} className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 last:border-0"><div><p className="font-medium text-stone-800">{item.roomName}</p><p className="text-xs text-stone-500">{item.reservations} reserva(s) · {item.selections} seleção(ões)</p></div><span className="font-semibold text-brand-700">{formatMinutes(item.minutes)}</span></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900"><Clock3 className="h-4 w-4 text-brand-600" />Horários mais utilizados</h2>
            <div className="mt-4 space-y-3">
              {report.byHour.length === 0 ? <Empty /> : report.byHour.map((item) => <div key={item.startTime} className="flex items-center justify-between border-b border-stone-100 pb-3 last:border-0"><div><p className="font-medium text-stone-800">A partir de {item.startTime}</p><p className="text-xs text-stone-500">{item.reservations} reserva(s)</p></div><span className="font-semibold text-brand-700">{formatMinutes(item.minutes)}</span></div>)}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-stone-900">Uso por dia</h2>
            <div className="mt-4 space-y-3">
              {report.byDay.length === 0 ? <Empty /> : report.byDay.map((item) => <div key={item.date}><div className="flex justify-between text-sm"><span className="font-medium text-stone-700">{formatDate(item.date)}</span><span className="text-stone-500">{formatMinutes(item.minutes)} · {item.selections} seleção(ões)</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(4, (item.minutes / maxDayMinutes) * 100)}%` }} /></div></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900"><Users className="h-4 w-4 text-brand-600" />Uso por usuário</h2>
            <div className="mt-4 space-y-3">
              {report.byUser.length === 0 ? <Empty /> : report.byUser.slice(0, 10).map((item) => <div key={`${item.userId ?? item.name}-${item.companyName}`} className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 last:border-0"><div className="min-w-0"><p className="truncate font-medium text-stone-800">{item.name}</p><p className="truncate text-xs text-stone-500">{item.companyName} · {item.cpf ?? "CPF não vinculado"}</p></div><div className="shrink-0 text-right"><p className="font-semibold text-brand-700">{formatMinutes(item.minutes)}</p><p className="text-xs text-stone-500">{item.reservations} reserva(s)</p></div></div>)}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}min` : `${hours}h`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function Empty() {
  return <p className="rounded-xl bg-stone-50 px-3 py-4 text-sm text-stone-500">Sem dados para os filtros atuais.</p>;
}
