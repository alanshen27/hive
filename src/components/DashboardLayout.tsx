'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User, Home, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DONT_SHOW_APP_SIDEBAR = [
  '/onboarding',
  '/auth',
  '/',
]

function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-4">
            <Image src="/logo-lg.png" alt="Hive" width={100} height={100} />
          </Link>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <Button variant="default" asChild>
              <Link href="/app">Go to app</Link>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  if (pathname === '/onboarding') {
    return (
      <div className="min-h-screen flex flex-col w-full max-w-full margin-0 p-0">
          {children}
      </div>
    )
  }

  if (DONT_SHOW_APP_SIDEBAR.includes(pathname)) {
    return (
      <div className="min-h-screen flex flex-col w-full max-w-full margin-0 p-0">
        <Navbar />
        <div className="flex-1 flex w-full justify-center items-center max-w-full">   
          {children}
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full max-w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 max-w-full overflow-hidden">
          <div className="w-full max-w-full">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}