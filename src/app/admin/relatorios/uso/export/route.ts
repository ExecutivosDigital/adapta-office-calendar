import { NextRequest } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { getRoomsReportApi } from "@/lib/api-client";
import { buildRoomsWorkbook } from "@/lib/reports/rooms-workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filtersSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  room_id: z.string().uuid().optional(),
});

// Nome de arquivo em ASCII: acento em Content-Disposition quebra em parte dos
// navegadores e o download chega com o nome corrompido.
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!(await isAdmin())) {
    return new Response("Não autorizado", { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const parsed = filtersSchema.safeParse({
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    room_id: params.get("room_id") || undefined,
  });
  if (!parsed.success) {
    return new Response("Filtros inválidos", { status: 400 });
  }

  const { from, to } = parsed.data;
  if (from && to && from > to) {
    return new Response("A data inicial deve ser anterior à data final", { status: 400 });
  }

  try {
    const report = await getRoomsReportApi(parsed.data);
    const generatedAt = new Date();
    const workbook = await buildRoomsWorkbook(report, generatedAt);

    const scope =
      report.rooms.length === 1 ? slugify(report.rooms[0].room.name) || "sala" : "salas";
    const filename = `relatorio-${scope}-${report.effectiveFrom}-a-${report.effectiveTo}.xlsx`;

    return new Response(workbook, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar o relatório";
    return new Response(message, { status: 500 });
  }
}
