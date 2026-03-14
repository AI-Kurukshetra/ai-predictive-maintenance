import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { DemoStoreProvider } from "@/lib/demo-store";

import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliMaintain Pro",
  description: "AI-assisted predictive maintenance platform for industrial operations teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DemoStoreProvider>
          <AppShell>{children}</AppShell>
        </DemoStoreProvider>
      </body>
    </html>
  );
}
