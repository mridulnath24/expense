
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { type Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils.tsx';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionDialog } from '../add-transaction-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/context/language-context';

interface ReportsDataTableProps {
  transactions: Transaction[];
}

export function ReportsDataTable({ transactions }: ReportsDataTableProps) {
  const { deleteTransaction, updateTransaction, getTranslatedCategory } = useData();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const isMobile = useIsMobile();

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id);
      toast({
        title: t('toast_transactionDeleted_title'),
        description: t('toast_transactionDeleted_desc'),
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };
  
  const renderMobileView = () => (
    <div className="space-y-3">
        {transactions.map(transaction => (
            <Card key={transaction.id} className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        <div className="text-sm">
                            <Badge variant="outline">{getTranslatedCategory(transaction.category, transaction.type)}</Badge>
                        </div>
                         <p className="text-sm text-muted-foreground">{format(new Date(transaction.date), 'PP')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                           {transaction.type === 'income' ? '+' : '-'}
                           {formatCurrency(transaction.amount)}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(transaction)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>{t('transactionTable_action_edit')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(transaction)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>{t('transactionTable_action_delete')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </Card>
        ))}
    </div>
  );

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('transactionTable_col_description')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('transactionTable_col_category')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('transactionTable_col_date')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('reports_col_type')}</TableHead>
          <TableHead className="text-right">{t('transactionTable_col_amount')}</TableHead>
          <TableHead className="w-[40px]">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">{transaction.description}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="outline">{getTranslatedCategory(transaction.category, transaction.type)}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">{format(new Date(transaction.date), 'PP')}</TableCell>
            <TableCell className="hidden sm:table-cell">
                 <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className={transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {t(`addTransaction_type_${transaction.type}`)}
                 </Badge>
            </TableCell>
            <TableCell
              className={`text-right font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <div className="flex items-center justify-end">
                <span>{transaction.type === 'income' ? '+' : '-'}</span>
                {formatCurrency(transaction.amount)}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(transaction)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>{t('transactionTable_action_edit')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(transaction)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{t('transactionTable_action_delete')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      {transactions.length > 0 ? (
        isMobile ? renderMobileView() : renderDesktopView()
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="rounded-full bg-secondary p-4">
             <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">{t('reports_noData_title')}</h3>
          <p className="text-muted-foreground">{t('reports_noData_desc')}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <AddTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transaction={selectedTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog_cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {t('deleteDialog_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
