"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label = "Menu",
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  label?: string
}) {
  const pathname = usePathname()
  // Prevent hydration mismatch by only rendering collapsible items after mount
  const [mounted, setMounted] = useState(false)

  // Required for hydration safety - must set mounted state after initial render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length && mounted ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem className="relative">
                {item.isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sidebar-foreground/70 dark:bg-sidebar-foreground/50" />
                )}
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                    className={cn(item.isActive && "shadow-sm dark:shadow-none")}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === subItem.url || pathname?.startsWith(subItem.url + "/")}>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title} className="relative">
              {item.isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sidebar-foreground/70 dark:bg-sidebar-foreground/50" />
              )}
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
                className={cn(item.isActive && "shadow-sm dark:shadow-none")}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length && !mounted ? (
                <SidebarMenuAction className="opacity-0">
                  <ChevronRight />
                </SidebarMenuAction>
              ) : null}
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
