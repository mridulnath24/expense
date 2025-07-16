'use client';

import { useMemo } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { type Transaction } from '@/lib/types';
import { isSameMonth, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface ExpenseByCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
];

export function ExpenseByCategoryChart({ transactions }: ExpenseByCategoryChartProps) {
  const { t } = useLanguage();
  const data = useMemo(() => {
    const today = new Date();
    const monthlyTransactions = transactions.filter(t => isSameMonth(new Date(t.date), today) && t.type === 'expense');

    const expenseByCategory = monthlyTransactions.reduce((acc, t) => {
      const categoryKey = `categories_expense_${t.category.toLowerCase().replace(/\s+/g, '')}`;
      const translatedCategory = t(categoryKey);
      if (!acc[t.category]) {
        acc[t.category] = { name: translatedCategory, value: 0 };
      }
      acc[t.category].value += t.amount;
      return acc;
    }, {} as Record<string, { name: string; value: number }>);
    
    return Object.values(expenseByCategory).sort((a,b) => b.value - a.value);

  }, [transactions, t]);

  const totalExpense = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);
  const monthName = format(new Date(), 'MMMM');
  const year = format(new Date(), 'yyyy');


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard_expenseByCategory')}</CardTitle>
        <CardDescription>
          {t('dashboard_expenseByCategory_desc', { month: monthName, year: year })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
            <ChartContainer
                config={{}}
                className="h-[300px] w-full"
            >
                <ResponsiveContainer>
                    <PieChart>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <p className="font-bold">{`${payload[0].name}`}</p>
                                        <p className="text-sm">{`${formatCurrency(payload[0].value as number)} (${(((payload[0].value as number) / totalExpense) * 100).toFixed(0)}%)`}</p>
                                    </div>
                                );
                                }
                                return null;
                            }}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                return (
                                    (percent*100) > 5 ? (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                    {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                ) : null)
                            }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
        ) : (
             <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed bg-secondary/50 py-12 text-center">
              <div className="rounded-full bg-background p-4 shadow">
                 <PieChartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">{t('reports_noExpenseData_title')}</h3>
              <p className="text-muted-foreground">{t('dashboard_monthlyExpenses_desc', { month: monthName })}</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
