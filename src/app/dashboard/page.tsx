'use client';

import { useData } from '@/hooks/use-data';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlySummaryCards } from '@/components/dashboard/monthly-summary-cards';
import { Separator } from '@/components/ui/separator';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseByCategoryChart } from '@/components/dashboard/expense-by-category-chart';

export default function DashboardPage() {
  const { data, loading } = useData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="space-y-4">
           <Skeleton className="h-6 w-48" />
           <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
           </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards transactions={data.transactions} />
      <div className="py-2">
        <Separator />
      </div>
      <MonthlySummaryCards transactions={data.transactions} />
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart transactions={data.transactions} />
        <ExpenseByCategoryChart transactions={data.transactions} />
      </div>
      <RecentTransactions transactions={data.transactions.slice(0, 10)} title="Recent Transactions" />
    </div>
  );
}
