
"use client";
import Link from 'next/link';
import { RumbosEnviosLogo } from '@/components/icons/logo';
import { NAV_ITEMS } from '@/components/layout/sidebar-nav-items';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Settings, LogOut, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import React from 'react';

// This component will be client-side to manage theme toggling
// For now, we'll keep it simple and not implement actual theme toggling logic
// to avoid hydration issues without proper setup.
const ThemeToggle = () => {
  const [isDark, setIsDark] = React.useState(false);
  
  React.useEffect(() => { 
    // Ensure this runs only on client
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => { 
    document.documentElement.classList.toggle('dark'); 
    setIsDark(prev => !prev); 
  }
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
      <Sun className={`h-5 w-5 rotate-0 scale-100 transition-all ${isDark ? 'dark:-rotate-90 dark:scale-0' : '' }`} />
      <Moon className={`absolute h-5 w-5 rotate-90 scale-0 transition-all ${isDark ? 'dark:rotate-0 dark:scale-100' : ''}`} />
    </Button>
  );
};


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href="/" aria-label="Rumbos Envios Home">
            <RumbosEnviosLogo className="h-8 group-data-[collapsible=icon]:hidden" />
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="justify-start"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/configuracion" passHref legacyBehavior>
                  <SidebarMenuButton tooltip={{children: "Configuración", side: "right"}} className="justify-start" isActive={pathname === "/configuracion"}>
                    <Settings className="h-5 w-5" />
                    <span>Configuración</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar"/>
                    <AvatarFallback>RE</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <SidebarInset>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </div>
  );
}
