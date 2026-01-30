"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"

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
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
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
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
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
