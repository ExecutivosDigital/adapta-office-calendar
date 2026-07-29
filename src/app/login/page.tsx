import { redirect } from "next/navigation";
import Image from "next/image";
import { AccountAuthForm } from "./account-auth-form";
import { getCurrentUser } from "@/lib/api-client";

export const metadata = {
  title: "Entrar · Adapta Offices",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    const { returnUrl } = await searchParams;
    redirect(returnUrl ?? "/");
  }

  const { returnUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.gif"
            alt="Adapta Offices"
            width={64}
            height={80}
            className="rounded-lg"
            priority
          />
          <h1 className="mt-4 text-xl font-semibold text-stone-900">
            Olá! 👋
          </h1>
          <p className="text-sm text-stone-500">
            Entre para reservar salas e acompanhar seus agendamentos.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-sm">
          <AccountAuthForm returnUrl={returnUrl ?? "/"} />
        </div>
      </div>
    </div>
  );
}
