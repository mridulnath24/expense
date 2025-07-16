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
import { useLanguage } from '@/context/language-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">{t('app_title')}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip={t('sidebar_dashboard')}
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>{t('sidebar_dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/reports')}
                tooltip={t('sidebar_reports')}
              >
                <Link href="/dashboard/reports">
                  <LineChart />
                  <span>{t('sidebar_reports')}</span>
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
              {pathname.includes('reports') ? t('header_reports') : t('header_dashboard')}
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
                  <span className="sr-only">{t('newTransaction_button')}</span>
                </Button>
                <Button onClick={() => setIsDialogOpen(true)} className="hidden sm:inline-flex">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>{t('newTransaction_button')}</span>
                </Button>
              </span>
            </AddTransactionDialog>
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <footer className="py-4 px-4 sm:px-6">
            <p className="text-center text-sm text-muted-foreground">
                Developed by Mridul Debnath
            </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
