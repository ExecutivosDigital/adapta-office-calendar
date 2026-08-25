import { NextResponse, type NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export const dynamic = "force-dynamic";

// Proxy same-origin para o painel de porta: o tablet faz polling aqui e nunca
// depende de CORS nem enxerga a URL interna da API.
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";

  try {
    const res = await fetch(`${API_URL}/display${qs}`, { cache: "no-store" });
    const body = await res.json();
    return NextResponse.json(body, {
      status: res.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "API indisponível" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
