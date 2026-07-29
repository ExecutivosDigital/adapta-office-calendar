"use client";

import { useEffect, useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetAdminUserPassword } from "@/server/actions/admin";
import type { AdminUser } from "@/types";

export function ResetPasswordModal({
  user,
  open,
  onOpenChange,
  onReset,
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (userId: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmation("");
      setError(null);
    }
  }, [open, user?.id]);

  if (!user) return null;
  const selectedUser = user;

  function handleSubmit() {
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await resetAdminUserPassword(selectedUser.id, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Senha redefinida com sucesso.");
      onOpenChange(false);
      onReset(selectedUser.id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Crie uma nova senha para {user.name}. A senha antiga não pode ser visualizada.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm text-stone-700">
          <div className="flex items-center gap-2 font-medium text-stone-900">
            <KeyRound className="h-4 w-4 text-brand-600" />
            {user.name}
          </div>
          <p className="mt-1 text-xs text-stone-600">Login/CPF: {user.cpf ?? "não cadastrado"}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-new-password">Nova senha</Label>
            <Input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirmar nova senha</Label>
            <Input
              id="admin-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isPending}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Redefinir senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
