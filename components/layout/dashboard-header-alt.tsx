'use client'

import { Separator } from '@/components/ui/separator'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { DynamicBreadcrumb } from '@/components/layout/dynamic-breadcrumb'

export function DashboardHeaderAlt() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 justify-between">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumb />
      </div>
      <div className="flex items-center px-4">
        <ThemeToggle iconOnly />
      </div>
    </header>
  )
}

