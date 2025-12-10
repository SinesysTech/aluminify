'use client'

import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'

export function DashboardHeader() {
  return (
    <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 justify-between">
      <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 md:mr-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumb />
      </div>
      <div className="flex items-center px-2 md:px-4">
        <ThemeToggle iconOnly />
      </div>
    </header>
  )
}

