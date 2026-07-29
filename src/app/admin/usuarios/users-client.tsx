"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, KeyRound, LayoutDashboard, LogOut, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listAdminUsers, signOutAdmin } from "@/server/actions/admin";
import { ResetPasswordModal } from "@/components/admin/reset-password-modal";
import type { AdminUser } from "@/types";
import type { Paginated } from "@/types";

export function UsersClient({ initialUsers }: { initialUsers: Paginated<AdminUser> }) {
  const [usersPage, setUsersPage] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSearching, startSearch] = useTransition();

  function runSearch(page = 1) {
    startSearch(async () => {
      try {
        setUsersPage(await listAdminUsers({ search: search || undefined, page, pageSize: 20 }));
      } catch {
        toast.error("Não foi possível buscar os usuários.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200/70 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.gif" alt="Adapta Offices" width={36} height={45} className="rounded-md" />
            <div>
              <p className="text-sm font-semibold text-stone-900">Adapta Offices</p>
              <p className="text-xs text-stone-500">Gestão de usuários</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild><Link href="/admin/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/admin/relatorios/uso"><BarChart3 className="mr-1.5 h-4 w-4" />Relatórios</Link></Button>
            <form action={signOutAdmin}><Button variant="ghost" size="sm" type="submit"><LogOut className="mr-1.5 h-4 w-4" />Sair</Button></form>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6 sm:py-10">
        <div>
          <div className="flex items-center gap-2 text-brand-700"><Users className="h-5 w-5" /><span className="text-sm font-semibold">Contas cadastradas</span></div>
          <h1 className="mt-2 text-2xl font-semibold text-stone-900">Usuários e acesso</h1>
          <p className="text-sm text-stone-500">Consulte o CPF usado como login e redefina a senha quando necessário. Senhas antigas nunca são exibidas.</p>
        </div>

        <form
          className="flex gap-2 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm"
          onSubmit={(event) => { event.preventDefault(); runSearch(); }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
            <Input className="pl-9" placeholder="Buscar por nome, CPF ou empresa" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Button type="submit" disabled={isSearching}>{isSearching ? "Buscando..." : "Buscar"}</Button>
        </form>

        {usersPage.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-sm text-stone-500">Nenhum usuário encontrado.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {usersPage.items.map((user) => (
              <div key={user.id} className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-stone-900"><Link className="hover:text-brand-700 hover:underline" href={`/admin/usuarios/${user.id}`}>{user.name}</Link></h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-600"><Building2 className="h-3.5 w-3.5 text-stone-400" />{user.company_name ?? "Empresa não informada"}</p>
                  </div>
                  <Badge variant={user.hasPassword ? "confirmed" : "neutral"}>{user.hasPassword ? "Acesso ativo" : "Sem senha"}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs uppercase tracking-wide text-stone-400">Login / CPF</dt><dd className="mt-0.5 font-medium text-stone-800">{user.cpf ?? "—"}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-stone-400">Reservas</dt><dd className="mt-0.5 flex items-center gap-1 font-medium text-stone-800"><CalendarDays className="h-3.5 w-3.5 text-brand-600" />{user.reservationCount}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-3">
                  <Button variant="ghost" size="sm" asChild><Link href={`/admin/usuarios/${user.id}`}>Ver histórico</Link></Button>
                  <Button variant="outline" size="sm" onClick={() => { setTarget(user); setModalOpen(true); }}>
                    <KeyRound className="mr-1.5 h-4 w-4" />Redefinir senha
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {usersPage.totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-stone-200/70 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-stone-500">{usersPage.total} usuário(s) · página {usersPage.page} de {usersPage.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={isSearching || usersPage.page <= 1} onClick={() => runSearch(usersPage.page - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={isSearching || usersPage.page >= usersPage.totalPages} onClick={() => runSearch(usersPage.page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </main>

      <ResetPasswordModal
        user={target}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onReset={(userId) => setUsersPage((previous) => ({ ...previous, items: previous.items.map((user) => user.id === userId ? { ...user, hasPassword: true, updated_at: new Date().toISOString() } : user) }))}
      />
    </div>
  );
}
