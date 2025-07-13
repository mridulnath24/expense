'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LineChart, PlusCircle } from 'lucide-react';
import Logo from './logo';
import { UserNav } from './user-nav';
import { AddTransactionDialog } from './add-transaction-dialog';
import { ThemeToggle } from './theme-toggle';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">Expense Tracker</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/reports')}
                tooltip="Reports"
              >
                <Link href="/dashboard/reports">
                  <LineChart />
                  <span>Reports</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
             <SidebarTrigger className="md:hidden" />
             <h1 className="text-xl font-semibold">
              {pathname.includes('reports') ? 'Reports' : 'Dashboard'}
             </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <AddTransactionDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <span>
                <Button onClick={() => setIsDialogOpen(true)} className="sm:hidden" variant="default" size="icon">
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">New Transaction</span>
                </Button>
                <Button onClick={() => setIsDialogOpen(true)} className="hidden sm:inline-flex">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>New Transaction</span>
                </Button>
              </span>
            </AddTransactionDialog>
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
