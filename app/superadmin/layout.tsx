import { SidebarProvider } from "@/components/ui/sidebar"
import { SuperAdminSidebar } from "./components/superadmin-sidebar"

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <SuperAdminSidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </SidebarProvider>
    )
}
