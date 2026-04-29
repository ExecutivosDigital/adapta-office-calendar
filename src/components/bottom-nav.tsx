"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ListChecks, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadLocalReservations } from "@/lib/local-reservations";

const WA_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999"
).replace(/\D/g, "");
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  "Olá! Gostaria de falar sobre uma reserva na Adapta Offices."
)}`;

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const list = loadLocalReservations().filter(
        (r) => r.status === "confirmed"
      );
      setCount(list.length);
    };
    update();
    const onChange = () => update();
    window.addEventListener("adapta:reservations-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("adapta:reservations-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  const isAgendamentos = pathname === "/" || pathname.startsWith("/agendamento");
  const isReservas = pathname.startsWith("/reservas");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100/70 bg-white/95 shadow-[0_-12px_30px_-12px_rgba(85,33,3,0.15)] backdrop-blur supports-[backdrop-filter]:bg-white/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        <NavItem
          href="/"
          label="Agendamentos"
          icon={<CalendarDays className="h-5 w-5" />}
          active={isAgendamentos}
        />
        <NavItem
          href="/reservas"
          label="Reservas feitas"
          icon={<ListChecks className="h-5 w-5" />}
          active={isReservas}
          badge={count > 0 ? count : undefined}
        />
        <NavItem
          href={WA_HREF}
          external
          label="WhatsApp"
          icon={<MessageCircle className="h-5 w-5" />}
          tone="whatsapp"
        />
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  external,
  tone,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  external?: boolean;
  tone?: "whatsapp";
  badge?: number;
}) {
  const className = cn(
    "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
    active && tone !== "whatsapp" && "text-brand-600",
    !active && tone !== "whatsapp" && "text-stone-500 hover:text-stone-800",
    tone === "whatsapp" && "text-emerald-600 hover:text-emerald-700"
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
          active && tone !== "whatsapp" && "bg-brand-gradient text-white shadow-brand-glow",
          !active && tone !== "whatsapp" && "bg-stone-100/60",
          tone === "whatsapp" && "bg-emerald-100"
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute right-[calc(50%-22px)] top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {content}
    </Link>
  );
}
