'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingChart } from '@/components/reports/spending-chart';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart } from 'lucide-react';

export default function ReportsPage() {
  const { data, loading } = useData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  if (loading) {
    return (
       <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2"/>
          <Skeleton className="h-4 w-3/4"/>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-64"/>
          <Skeleton className="h-96 w-full"/>
        </CardContent>
      </Card>
    )
  }

  const filteredTransactions = data.transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const from = dateRange?.from ? new Date(dateRange.from.setHours(0,0,0,0)) : undefined;
    const to = dateRange?.to ? new Date(dateRange.to.setHours(23,59,59,999)) : undefined;
    return (!from || transactionDate >= from) && (!to || transactionDate <= to);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spending Report</CardTitle>
          <CardDescription>
            Analyze your spending habits by category over a selected period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          {filteredTransactions.filter(t => t.type === 'expense').length > 0 ? (
            <SpendingChart transactions={filteredTransactions} />
          ) : (
            <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed bg-secondary/50 py-12 text-center">
              <div className="rounded-full bg-background p-4 shadow">
                 <BarChart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No expense data</h3>
              <p className="text-muted-foreground">There are no expenses recorded in this period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
