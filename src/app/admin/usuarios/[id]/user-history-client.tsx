"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BarChart3, Building2, CalendarDays, Clock3, KeyRound, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/admin/metric-card";
import { signOutAdmin } from "@/server/actions/admin";
import { durationMinutes, formatDateShort, formatSlotDuration, normalizeTime, selectionCount } from "@/lib/time-slots";
import type { AdminUserDetails, Paginated, ReservationWithRoom } from "@/types";

export function UserHistoryClient({
  user,
  history,
  status,
}: {
  user: AdminUserDetails;
  history: Paginated<ReservationWithRoom>;
  status?: "confirmed" | "cancelled";
}) {
  const router = useRouter();

  function changeStatus(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    router.push(`/admin/usuarios/${user.id}${params.toString() ? `?${params}` : ""}`);
  }

  function changePage(page: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    router.push(`/admin/usuarios/${user.id}?${params}`);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200/70 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.gif" alt="Adapta Offices" width={36} height={45} className="rounded-md" />
            <div><p className="text-sm font-semibold text-stone-900">Adapta Offices</p><p className="text-xs text-stone-500">Histórico individual</p></div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild><Link href="/admin/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/admin/relatorios/uso"><BarChart3 className="mr-1.5 h-4 w-4" />Relatórios</Link></Button>
            <form action={signOutAdmin}><Button variant="ghost" size="sm" type="submit"><LogOut className="mr-1.5 h-4 w-4" />Sair</Button></form>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/usuarios" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" />Voltar para usuários</Link>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><Users className="h-6 w-6" /></div>
              <div><h1 className="text-2xl font-semibold text-stone-900">{user.name}</h1><p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600"><Building2 className="h-4 w-4 text-stone-400" />{user.company_name ?? "Empresa não informada"}</p><p className="mt-1 text-xs text-stone-500">Login/CPF: {user.cpf ?? "não cadastrado"} · Conta criada em {formatDateTime(user.created_at)}</p></div>
            </div>
          </div>
          <Button variant="outline" asChild><Link href="/admin/usuarios"><KeyRound className="mr-2 h-4 w-4" />Gerenciar senha</Link></Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total de reservas" value={user.summary.totalReservations} icon={CalendarDays} tone="brand" />
          <MetricCard label="Confirmadas" value={user.summary.confirmedReservations} icon={CalendarDays} tone="emerald" />
          <MetricCard label="Canceladas" value={user.summary.cancelledReservations} icon={CalendarDays} tone="stone" />
          <MetricCard label="Minutos usados" value={formatMinutes(user.summary.totalMinutesUsed)} icon={Clock3} tone="amber" />
          <MetricCard label="Seleções" value={user.summary.confirmedSelections} icon={BarChart3} tone="brand" />
        </div>

        <section className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold text-stone-900">Histórico de reservas</h2><p className="text-sm text-stone-500">{history.total} registro(s) encontrado(s), com paginação.</p></div>
            <div className="flex items-center gap-2"><span className="text-sm text-stone-500">Status</span><Select value={status ?? "all"} onValueChange={changeStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="confirmed">Confirmadas</SelectItem><SelectItem value="cancelled">Canceladas</SelectItem></SelectContent></Select></div>
          </div>

          {history.items.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">Nenhuma reserva neste filtro.</p> : <div className="mt-5 overflow-x-auto rounded-xl border border-stone-100"><table className="w-full min-w-[780px] text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Data / horário</th><th className="px-4 py-3">Sala</th><th className="px-4 py-3">Uso</th><th className="px-4 py-3">Criada em</th><th className="px-4 py-3">Status / cancelamento</th></tr></thead><tbody className="divide-y divide-stone-100">{history.items.map((reservation) => <tr key={reservation.id}><td className="px-4 py-3"><p className="font-medium text-stone-800">{formatDateShort(reservation.reservation_date)}</p><p className="text-xs text-stone-500">{normalizeTime(reservation.start_time)} — {normalizeTime(reservation.end_time)}</p></td><td className="px-4 py-3 text-stone-700">{reservation.room.name}</td><td className="px-4 py-3"><p className="font-medium text-stone-800">{selectionCount(reservation.slot_count, reservation.start_time, reservation.end_time)} seleção(ões)</p><p className="text-xs text-stone-500">{formatSlotDuration(durationMinutes(reservation.start_time, reservation.end_time))}</p></td><td className="px-4 py-3 text-xs text-stone-500">{formatDateTime(reservation.created_at)}</td><td className="px-4 py-3"><Badge variant={reservation.status === "confirmed" ? "confirmed" : "cancelled"}>{reservation.status === "confirmed" ? "Confirmada" : "Cancelada"}</Badge>{reservation.status === "cancelled" && <p className="mt-1 max-w-[220px] text-xs text-stone-500">Por {reservation.cancelledByUser?.name ?? reservation.cancelled_by ?? "—"}{reservation.cancelled_at ? ` · ${formatDateTime(reservation.cancelled_at)}` : ""}</p>}</td></tr>)}</tbody></table></div>}

          {history.totalPages > 1 && <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="text-stone-500">Página {history.page} de {history.totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={history.page <= 1} onClick={() => changePage(history.page - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={history.page >= history.totalPages} onClick={() => changePage(history.page + 1)}>Próxima</Button></div></div>}
        </section>
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
