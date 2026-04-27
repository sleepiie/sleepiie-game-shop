import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AntdProvider } from "@/components/AntdProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GameShop — Buy Game Keys Instantly",
  description:
    "Discover and buy digital game keys for PC, PlayStation, Xbox, and more at the best prices.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "#0f0f1a", minHeight: "100vh" }}>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
