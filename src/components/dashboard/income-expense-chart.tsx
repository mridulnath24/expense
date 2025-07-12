'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type Transaction } from '@/lib/types';
import { format, subDays, isAfter } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const data = useMemo(() => {
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
    
    const chartData = [];
    for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dayKey = format(date, 'MMM d');
        if (groupedData[dayKey]) {
            chartData.push(groupedData[dayKey]);
        } else {
            chartData.push({ date: dayKey, income: 0, expense: 0 });
        }
    }

    return chartData.reverse();

  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs. Expense</CardTitle>
        <CardDescription>
          A visual overview of your income and expenses over the past 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer
            config={{
              income: {
                label: "Income",
                color: "hsl(var(--chart-1))",
              },
              expense: {
                label: "Expense",
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
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number).slice(1)} />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-bold">{payload[0].payload.date}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Income
                                    </span>
                                    <span className="font-bold text-green-500">
                                        {formatCurrency(payload[0].value as number)}
                                    </span>
                                    </div>
                                    <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Expense
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
              <h3 className="text-xl font-semibold">Not enough data</h3>
              <p className="text-muted-foreground">There is not enough transaction data to display a chart.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
