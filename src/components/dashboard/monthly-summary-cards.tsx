'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { type Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { isSameMonth, startOfMonth } from 'date-fns';

interface MonthlySummaryCardsProps {
  transactions: Transaction[];
}

export function MonthlySummaryCards({ transactions }: MonthlySummaryCardsProps) {
  const { income, expense, balance } = useMemo(() => {
    const today = new Date();
    const monthlyTransactions = transactions.filter(t => isSameMonth(new Date(t.date), today));

    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    return { income, expense, balance };
  }, [transactions]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">This Month's Summary</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(income)}</div>
            <p className="text-xs text-muted-foreground">in {format(new Date(), 'MMMM')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expense)}</div>
            <p className="text-xs text-muted-foreground">in {format(new Date(), 'MMMM')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Balance</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground">for {format(new Date(), 'MMMM')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
