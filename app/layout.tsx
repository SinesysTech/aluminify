import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { cn } from "@/app/shared/library/utils";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "@/components/providers/theme-provider";
import GoogleAnalyticsInit from "@/app/shared/core/ga";
import { fontVariables } from "@/app/shared/core/fonts";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";
import "katex/dist/katex.min.css";


import { DEFAULT_THEME } from "@/app/shared/core/themes";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Aluminify",
    template: "%s | Aluminify"
  },
  description: "Plataforma de ensino e aprendizado personalizado"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeSettings = {
    preset: cookieStore.get("theme_preset")?.value ?? DEFAULT_THEME.preset,
    scale: cookieStore.get("theme_scale")?.value ?? DEFAULT_THEME.scale,
    radius: cookieStore.get("theme_radius")?.value ?? DEFAULT_THEME.radius,
    contentLayout: cookieStore.get("theme_content_layout")?.value ??
      DEFAULT_THEME.contentLayout
  };

  const bodyAttributes = Object.fromEntries(
    Object.entries(themeSettings)
      .filter(([_, value]) => value)
      .map(([key, value]) => [`data-theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`, value])
  );

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className={cn("bg-background group/layout font-sans", fontVariables)}
        {...bodyAttributes}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" richColors />
            <NextTopLoader color="var(--primary)" showSpinner={false} height={2} shadow-sm="none" />
            {process.env.NODE_ENV === "production" ? <GoogleAnalyticsInit /> : null}
          </ThemeProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
