import type { Metadata, Viewport } from "next";
import { PainelClient } from "./painel-client";

export const metadata: Metadata = {
  title: "Adapta Offices · Painel de Salas",
  description: "Painel de porta com a agenda das salas e o tempo restante.",
};

// Painel roda em tablet fixo na parede: sem zoom, colado nas bordas.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08080A",
  viewportFit: "cover",
};

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ sala?: string }>;
}) {
  const { sala } = await searchParams;

  return (
    <PainelClient
      initialSlug={sala}
      wifiSsid={process.env.NEXT_PUBLIC_WIFI_SSID}
    />
  );
}
