import type { Metadata } from "next";

import { SidebarNav } from "./components/sidebar-nav";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerencie as configurações da sua empresa.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-container">
      <div className="space-y-0.5">
        <h2 className="page-title">Configurações</h2>
        <p className="page-subtitle">
          Gerencie as configurações da sua empresa.
        </p>
      </div>
      <div className="flex flex-col gap-(--space-section) lg:flex-row">
        <aside className="lg:w-64 shrink-0">
          <SidebarNav />
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
