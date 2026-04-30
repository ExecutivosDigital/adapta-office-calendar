"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/utils";
import { checkPhone, loginByPhone } from "@/server/actions/auth";

export function PhoneLoginForm({ returnUrl }: { returnUrl: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const digits = phone.replace(/\D/g, "");

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (digits.length < 10) {
      setError("Telefone inválido — inclua DDD + número.");
      return;
    }

    setIsPending(true);
    try {
      const { exists } = await checkPhone(digits);

      if (exists) {
        const result = await loginByPhone(digits);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(returnUrl);
        router.refresh();
      } else {
        setStep("name");
      }
    } catch {
      setError("Sem conexão com o servidor. Tente novamente.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }

    setIsPending(true);
    try {
      const result = await loginByPhone(digits, name.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(returnUrl);
      router.refresh();
    } catch {
      setError("Sem conexão com o servidor. Tente novamente.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700">
        <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div className="text-sm leading-relaxed">
          <p className="font-medium text-stone-900">Acesso por telefone</p>
          <p className="text-stone-600">
            Usamos seu número para identificar suas reservas.
          </p>
        </div>
      </div>

      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              name="tel"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              autoFocus
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              disabled={isPending}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Verificando..." : "Continuar"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-display">Telefone</Label>
            <div className="flex items-center gap-2">
              <Input
                id="phone-display"
                value={phone}
                disabled
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(null); }}
                className="text-xs text-brand-600 underline underline-offset-2 hover:text-brand-800 whitespace-nowrap"
              >
                Trocar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Como gostaria de ser chamado(a)?"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      )}
    </div>
  );
}
