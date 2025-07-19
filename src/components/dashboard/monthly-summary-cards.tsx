'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { type Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils.tsx';
import { isSameMonth, format } from 'date-fns';
import { useLanguage } from '@/context/language-context';

interface MonthlySummaryCardsProps {
  transactions: Transaction[];
}

export function MonthlySummaryCards({ transactions }: MonthlySummaryCardsProps) {
  const { t, locale } = useLanguage();
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
  
  const monthName = useMemo(() => format(new Date(), 'MMMM'), []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t('dashboard_monthlySummary')}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard_monthlyIncome')}</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(income)}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard_monthlyIncome_desc', { month: monthName })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard_monthlyExpenses')}</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expense)}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard_monthlyExpenses_desc', { month: monthName })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard_monthlyBalance')}</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard_monthlyBalance_desc', { month: monthName })}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
