"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, IdCard, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CpfInput } from "@/components/ui/cpf-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidCpf } from "@/lib/cpf";
import { loginAccount, registerAccount } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";
type Field = "name" | "cpf" | "company_name" | "password";

export function AccountAuthForm({ returnUrl }: { returnUrl: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setErrors({});
    setServerError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: Partial<Record<Field, string>> = {};
    if (!isValidCpf(cpf)) nextErrors.cpf = "Informe um CPF válido.";
    if (!password) nextErrors.password = "Informe sua senha.";
    if (mode === "register") {
      if (name.trim().split(/\s+/).length < 2) {
        nextErrors.name = "Informe seu nome completo.";
      }
      if (companyName.trim().length < 2) {
        nextErrors.company_name = "Informe a empresa da qual você faz parte.";
      }
      if (password.length < 8) {
        nextErrors.password = "Crie uma senha com pelo menos 8 caracteres.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsPending(true);
    const result =
      mode === "login"
        ? await loginAccount({ cpf, password })
        : await registerAccount({
            name: name.trim(),
            cpf,
            company_name: companyName.trim(),
            password,
          });
    setIsPending(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    const safeReturnUrl =
      returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : "/";
    router.push(safeReturnUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div
        className="grid grid-cols-2 rounded-xl bg-stone-100 p-1"
        aria-label="Escolha entrar ou criar conta"
      >
        <button
          type="button"
          aria-pressed={mode === "login"}
          onClick={() => changeMode("login")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            mode === "login"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          )}
        >
          Entrar
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => changeMode("register")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            mode === "register"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          )}
        >
          Criar conta
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
        {mode === "login" ? (
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        ) : (
          <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        )}
        <div className="text-sm leading-relaxed">
          <p className="font-medium text-stone-900">
            {mode === "login" ? "Acesse sua conta" : "Cadastre-se gratuitamente"}
          </p>
          <p className="text-stone-600">
            {mode === "login"
              ? "Use seu CPF e a senha criada no cadastro."
              : "Seus dados identificarão suas reservas para as outras pessoas."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "register" && (
          <FieldContainer error={errors.name}>
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <UserRound
                aria-hidden
                className="absolute left-3 top-3.5 h-5 w-5 text-stone-400"
              />
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="Nome e sobrenome"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="pl-10"
              />
            </div>
            {errors.name && <FieldError id="name-error">{errors.name}</FieldError>}
          </FieldContainer>
        )}

        <FieldContainer error={errors.cpf}>
          <Label htmlFor="cpf">CPF</Label>
          <div className="relative">
            <IdCard
              aria-hidden
              className="absolute left-3 top-3.5 z-10 h-5 w-5 text-stone-400"
            />
            <CpfInput
              id="cpf"
              name="cpf"
              placeholder="000.000.000-00"
              value={cpf}
              onValueChange={setCpf}
              autoFocus={mode === "login"}
              disabled={isPending}
              aria-invalid={Boolean(errors.cpf)}
              aria-describedby={errors.cpf ? "cpf-error" : undefined}
              className="pl-10"
            />
          </div>
          {errors.cpf && <FieldError id="cpf-error">{errors.cpf}</FieldError>}
        </FieldContainer>

        {mode === "register" && (
          <FieldContainer error={errors.company_name}>
            <Label htmlFor="company_name">Empresa</Label>
            <div className="relative">
              <Building2
                aria-hidden
                className="absolute left-3 top-3.5 h-5 w-5 text-stone-400"
              />
              <Input
                id="company_name"
                name="organization"
                autoComplete="organization"
                placeholder="Empresa da qual você faz parte"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(errors.company_name)}
                aria-describedby={
                  errors.company_name ? "company-name-error" : undefined
                }
                className="pl-10"
              />
            </div>
            {errors.company_name && (
              <FieldError id="company-name-error">
                {errors.company_name}
              </FieldError>
            )}
          </FieldContainer>
        )}

        <FieldContainer error={errors.password}>
          <Label htmlFor="password">
            {mode === "login" ? "Senha" : "Crie uma senha"}
          </Label>
          <div className="relative">
            <LockKeyhole
              aria-hidden
              className="absolute left-3 top-3.5 h-5 w-5 text-stone-400"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Sua senha" : "Mínimo de 8 caracteres"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pl-10"
            />
          </div>
          {errors.password && (
            <FieldError id="password-error">{errors.password}</FieldError>
          )}
        </FieldContainer>

        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? mode === "login"
              ? "Entrando..."
              : "Criando conta..."
            : mode === "login"
            ? "Entrar"
            : "Criar conta e entrar"}
        </Button>
      </form>
    </div>
  );
}

function FieldContainer({
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return <div className="space-y-2">{children}</div>;
}

function FieldError({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <p id={id} className="text-xs text-red-600">
      {children}
    </p>
  );
}
