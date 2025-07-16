'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingChart } from '@/components/reports/spending-chart';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart, FileDown, FileType } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/utils';
import { type Transaction } from '@/lib/types';
import { useLanguage } from '@/context/language-context';


export default function ReportsPage() {
  const { data, loading } = useData();
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredTransactions = data.transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const from = dateRange?.from ? new Date(dateRange.from.setHours(0,0,0,0)) : undefined;
    const to = dateRange?.to ? new Date(dateRange.to.setHours(23,59,59,999)) : undefined;
    return (!from || transactionDate >= from) && (!to || transactionDate <= to);
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Description", "Category", "Type", "Amount"];
    const tableRows: (string | number)[][] = [];
    
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(transaction => {
      const transactionData = [
        format(new Date(transaction.date), "yyyy-MM-dd"),
        transaction.description,
        transaction.category,
        transaction.type,
        formatCurrency(transaction.amount),
      ];
      tableRows.push(transactionData);
      if(transaction.type === 'income') totalIncome += transaction.amount
      else totalExpense += transaction.amount
    });

    const dateFrom = dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : 'start';
    const dateTo = dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : 'today';

    doc.setFontSize(18);
    doc.text("Expense Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 14, 30);
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 14, finalY + 10);
    doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 14, finalY + 17);
    doc.text(`Balance: ${formatCurrency(totalIncome - totalExpense)}`, 14, finalY + 24);

    doc.save(`report_${dateFrom}_-_${dateTo}.pdf`);
  };

  const generateExcel = () => {
    const worksheetData = filteredTransactions.map(t => ({
        Date: format(new Date(t.date), "yyyy-MM-dd"),
        Description: t.description,
        Category: t.category,
        Type: t.type,
        Amount: t.amount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    const dateFrom = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
    const dateTo = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'today';

    XLSX.writeFile(workbook, `report_${dateFrom}_-_${dateTo}.xlsx`);
  };


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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('reports_title')}</CardTitle>
            <CardDescription>
              {t('reports_desc')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generatePDF} disabled={filteredTransactions.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                {t('reports_pdf_button')}
            </Button>
            <Button variant="outline" onClick={generateExcel} disabled={filteredTransactions.length === 0}>
                <FileType className="mr-2 h-4 w-4" />
                {t('reports_excel_button')}
            </Button>
          </div>
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
              <h3 className="text-xl font-semibold">{t('reports_noExpenseData_title')}</h3>
              <p className="text-muted-foreground">{t('reports_noExpenseData_desc')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
