import type { Metadata } from "next";

import { SidebarNav } from "./components/sidebar-nav";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerencie as configurações da sua empresa.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 max-w-5xl mx-auto lg:space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua empresa.
        </p>
      </div>
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        <aside className="lg:w-64">
          <SidebarNav />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
