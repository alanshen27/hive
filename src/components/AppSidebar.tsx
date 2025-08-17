"use client";

import { BookOpen, Home, Users, Search, Bell, Settings, Plus, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
  import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "./ui/button";
import Image from "next/image";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Groups", url: "/my-groups", icon: Users },
  { title: "Explore", url: "/explore", icon: Search },
  { title: "Notifications", url: "/notifications", icon: Bell, showBadge: true },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const currentPath = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => currentPath === path;

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="p-4 pb-1">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image src="/logo-lg.png" alt="StudyHive" width={100} height={100} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className={isActive(item.url) ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    <Link href={item.url} className="relative">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.showBadge && 0 > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/create-group">
                    <Plus className="h-4 w-4" />
                    <span>Create Group</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="flex items-center space-x-2 mt-4 p-2 bg-secondary rounded-lg">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.avatar || ""} />
            <AvatarFallback>
              {getUserInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email || "student"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />  
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}