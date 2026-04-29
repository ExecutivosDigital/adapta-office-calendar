import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Adapta Offices · Agendamento de Salas",
  description:
    "Reserve sua sala de reunião na Adapta Offices em poucos cliques.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="min-h-screen font-sans pb-[88px] sm:pb-0">
        {children}
        <BottomNav />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { borderRadius: "12px" },
          }}
        />
      </body>
    </html>
  );
}
