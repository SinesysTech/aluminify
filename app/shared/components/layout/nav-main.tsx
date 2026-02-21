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
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length && mounted ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                    className={cn(
                      "transition-colors duration-200",
                      item.isActive && "bg-sidebar-accent font-medium"
                    )}
                  >
                    <item.icon className={cn(
                      "transition-colors duration-200",
                      item.isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                    )} />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto size-4 text-sidebar-foreground/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const isSubActive = pathname === subItem.url || pathname?.startsWith(subItem.url + "/")
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={cn(
                              "transition-colors duration-200",
                              isSubActive && "font-medium text-sidebar-primary"
                            )}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
                className={cn(
                  "transition-colors duration-200",
                  item.isActive && "bg-sidebar-accent font-medium"
                )}
              >
                <Link href={item.url}>
                  <item.icon className={cn(
                    "transition-colors duration-200",
                    item.isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                  )} />
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
