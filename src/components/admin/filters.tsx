"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Room } from "@/types";

export function AdminFilters({
  rooms,
  initial,
}: {
  rooms: Room[];
  initial: {
    date?: string;
    room_id?: string;
    status?: "confirmed" | "cancelled";
  };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.push(`/admin/dashboard?${next.toString()}`);
    });
  };

  const clear = () => {
    startTransition(() => {
      router.push("/admin/dashboard");
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-date">Data</Label>
          <Input
            id="filter-date"
            type="date"
            defaultValue={initial.date ?? ""}
            onChange={(e) => update("date", e.target.value || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Sala</Label>
          <Select
            value={initial.room_id ?? "all"}
            onValueChange={(v) => update("room_id", v === "all" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={initial.status ?? "all"}
            onValueChange={(v) =>
              update("status", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(initial.date || initial.room_id || initial.status) && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={isPending}
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
