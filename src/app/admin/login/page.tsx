import { LoginForm } from "./login-form";
import Image from "next/image";

export default function AdminLoginPage() {
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
            Acesso administrativo
          </h1>
          <p className="text-sm text-stone-500">
            Entre para gerenciar as reservas das salas.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
