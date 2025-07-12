'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRightLeft } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{t.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{format(new Date(t.date), 'PP')}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      t.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-secondary p-4">
               <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No transactions yet</h3>
            <p className="text-muted-foreground">Add your first transaction to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
