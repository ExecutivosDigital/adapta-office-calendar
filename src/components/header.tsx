import Image from "next/image";
import Link from "next/link";

export function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header className="relative border-b border-brand-100/70 bg-white/70 backdrop-blur">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-brand-gradient"
      />
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-12 w-11 items-center justify-center rounded-xl bg-brand-gradient shadow-brand-glow transition-transform group-hover:scale-105">
            <Image
              src="/logo.gif"
              alt="Adapta Offices"
              width={36}
              height={48}
              className="h-9 w-auto rounded-md"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight text-stone-900">
              Adapta Offices
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              {subtitle ?? "Agendamento de Salas"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
