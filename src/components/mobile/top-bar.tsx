"use client";

import { ChevronLeft } from "lucide-react";

export function MobileTopBar({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container relative flex h-16 items-center justify-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="tap-scale absolute left-4 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="font-display text-base font-extrabold uppercase tracking-[0.2em] text-stone-900">
          {title}
        </h1>
      </div>
    </header>
  );
}
