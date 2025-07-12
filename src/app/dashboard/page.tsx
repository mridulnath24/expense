'use client';

import { useData } from '@/hooks/use-data';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data, loading } = useData();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SummaryCards transactions={data.transactions} />
      <RecentTransactions transactions={data.transactions.slice(0, 10)} />
    </div>
  );
}
