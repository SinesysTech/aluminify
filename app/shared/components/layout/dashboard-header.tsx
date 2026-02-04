'use client'

import { Separator } from '@/components/ui/separator'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { DynamicBreadcrumb } from '@/components/layout/dynamic-breadcrumb'
import { MobileOrgSwitcher } from '@/components/layout/mobile-org-switcher'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 md:h-16 shrink-0 items-center gap-2 justify-between bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="hidden md:block mr-1 md:mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="min-w-0 overflow-hidden">
          <DynamicBreadcrumb />
        </div>
      </div>
      <div className="flex items-center gap-2 px-2 md:px-4 shrink-0">
        <MobileOrgSwitcher />
        <ThemeToggle iconOnly />
      </div>
    </header>
  )
}

