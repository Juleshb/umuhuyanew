"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { InstallPrompt } from "@/components/install-prompt";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAppShell =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/offline");
  const isMapExplorer = pathname.startsWith("/properties/map");

  if (isAppShell) {
    return (
      <>
        {children}
        <InstallPrompt />
      </>
    );
  }

  if (isMapExplorer) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <SiteHeader />
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        <MobileTabBar />
        <InstallPrompt />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <SiteFooter />
      </div>
      <MobileTabBar />
      <InstallPrompt />
    </div>
  );
}
