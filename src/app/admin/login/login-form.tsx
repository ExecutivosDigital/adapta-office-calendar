"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAdmin, type SignInState } from "@/server/actions/admin";

const initialState: SignInState = { ok: true };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAdmin, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="text-sm leading-relaxed">
          <p className="font-medium text-stone-900">Acesso restrito</p>
          <p className="text-stone-600">
            Use seu nome de usuário e a senha compartilhada da equipe.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuário</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="ex.: joao"
          required
          minLength={3}
          maxLength={40}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar no painel"}
      </Button>
    </form>
  );
}
