
'use client';

import { useMemo, useCallback } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { type Transaction } from '@/lib/types';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils.tsx';
import { useLanguage } from '@/context/language-context';


interface SpendingChartProps {
  transactions: Transaction[];
}

export function SpendingChart({ transactions }: SpendingChartProps) {
  const { t } = useLanguage();

  const getTranslatedCategory = useCallback((categoryName: string, type: 'income' | 'expense') => {
    const originalKey = `categories_${type}_${categoryName.toLowerCase().replace(/\s+/g, '')}`;
    let translated = t(originalKey);
    
    if (translated === originalKey) {
        const pluralKey = `categories_${type}_${(categoryName + 's').toLowerCase().replace(/\s+/g, '')}`;
        translated = t(pluralKey);
        if(translated !== pluralKey) return translated;

        if (categoryName.endsWith('s')) {
          const singularKey = `categories_${type}_${(categoryName.slice(0,-1)).toLowerCase().replace(/\s+/g, '')}`;
          translated = t(singularKey);
          if(translated !== singularKey) return translated;
        }

        return categoryName;
    }
    
    return translated;
  }, [t]);

  const data = useMemo(() => {
    const expenseByCategory = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((acc, transaction) => {
        const name = transaction.category;
        
        if (!acc[transaction.category]) {
          acc[transaction.category] = { name: name, total: 0 };
        }
        acc[transaction.category].total += transaction.amount;
        return acc;
      }, {} as { [key: string]: { name: string; total: number } });

    return Object.values(expenseByCategory)
      .sort((a, b) => b.total - a.total)
      .map(item => ({...item, name: getTranslatedCategory(item.name, 'expense')}));
  }, [transactions, getTranslatedCategory]);

  return (
    <div className="h-[400px] w-full">
      <ChartContainer
        config={{
          total: {
            label: t('reports_spendingChart_amount'),
            color: "hsl(var(--primary))",
          },
        }}
        className="h-full w-full"
      >
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--foreground))"
              fontSize={12}
              width={100}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
             <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {t('reports_spendingChart_category')}
                          </span>
                          <span className="font-bold text-foreground">
                            {data.name}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {t('reports_spendingChart_amount')}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(data.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
