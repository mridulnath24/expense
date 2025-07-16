'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type Transaction } from '@/lib/types';
import { format, subDays, isAfter } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const { t } = useLanguage();
  const { data, yAxisDomain, yAxisTicks } = useMemo(() => {
    const last30Days = subDays(new Date(), 29);
    const relevantTransactions = transactions.filter(t => isAfter(new Date(t.date), last30Days));

    const groupedData = relevantTransactions.reduce((acc, t) => {
      const day = format(new Date(t.date), 'MMM d');
      if (!acc[day]) {
        acc[day] = { date: day, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[day].income += t.amount;
      } else {
        acc[day].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number }>);
    
    let chartData = [];
    let maxVal = 0;
    for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dayKey = format(date, 'MMM d');
        const dayData = groupedData[dayKey] || { date: dayKey, income: 0, expense: 0 };
        chartData.push(dayData);
        if(dayData.income > maxVal) maxVal = dayData.income;
        if(dayData.expense > maxVal) maxVal = dayData.expense;
    }

    const yDomain: [number, number] = [0, maxVal > 0 ? maxVal * 1.1 : 100];
    const ticks = [0, yDomain[1] * 0.25, yDomain[1] * 0.5, yDomain[1] * 0.75, yDomain[1]];
    
    return { data: chartData.reverse(), yAxisDomain: yDomain, yAxisTicks: ticks };

  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard_incomeVsExpense')}</CardTitle>
        <CardDescription>
          {t('dashboard_incomeVsExpense_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer
            config={{
              income: {
                label: t('chart_income'),
                color: "hsl(var(--chart-1))",
              },
              expense: {
                label: t('chart_expense'),
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer>
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                        stroke="hsl(var(--foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => formatCurrency(value as number)}
                        domain={yAxisDomain}
                        ticks={yAxisTicks}
                        width={80}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-bold">{payload[0].payload.date}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {t('chart_income')}
                                    </span>
                                    <span className="font-bold text-green-500">
                                        {formatCurrency(payload[0].value as number)}
                                    </span>
                                    </div>
                                    <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {t('chart_expense')}
                                    </span>
                                    <span className="font-bold text-red-500">
                                        {formatCurrency(payload[1].value as number)}
                                    </span>
                                    </div>
                                </div>
                                </div>
                            );
                            }
                            return null;
                        }}
                    />
                    <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                    <Area type="monotone" dataKey="income" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="expense" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.4} />
                </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
             <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed bg-secondary/50 py-12 text-center">
              <div className="rounded-full bg-background p-4 shadow">
                 <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">{t('chart_notEnoughData_title')}</h3>
              <p className="text-muted-foreground">{t('chart_notEnoughData_desc')}</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
