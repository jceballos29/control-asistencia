import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { Building, CalendarDays } from "lucide-react";
import React from "react";

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const menu = [
    {
      label: "Consultorios",
      href: "/admin/offices",
      icon: Building,
    },
  ]

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      {...props}
      className="overflow-hidden select-none"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <CalendarDays className="size-4" />
                </div>
                <div className="flex flex-col leading-none truncate">
                  <span className="font-semibold">Control de Asistencia</span>
                  <span className="text-muted-foreground text-xs">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menu.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link
                  to={item.href}
                  className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  <item.icon className="size-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="py-0"></SidebarFooter>
    </Sidebar>
  );
}
