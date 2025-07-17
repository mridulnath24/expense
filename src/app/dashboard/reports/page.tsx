
'use client';

import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format, startOfMonth, endOfMonth, parse, getYear, setMonth, setYear, startOfYear, endOfYear } from 'date-fns';
import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SpendingChart } from '@/components/reports/spending-chart';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart, FileDown, FileType, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/utils';
import { type Transaction } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportsDataTable } from '@/components/reports/reports-data-table';
import { Separator } from '@/components/ui/separator';
import { SmartSearch } from '@/components/dashboard/smart-search';

export default function ReportsPage() {
  const { data, loading } = useData();
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [selectedYear, setSelectedYear] = useState<string>(getYear(new Date()).toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    if (newDateRange?.from) {
      const fromYear = getYear(newDateRange.from).toString();
      setSelectedYear(fromYear);
      if (newDateRange.to && format(newDateRange.from, 'yyyy-MM') !== format(newDateRange.to, 'yyyy-MM')) {
        setSelectedMonth('custom');
      } else {
        setSelectedMonth(format(newDateRange.from, 'yyyy-MM'));
      }
    } else {
      setSelectedYear(getYear(new Date()).toString());
      setSelectedMonth('all-months');
    }
  };

  const availableYears = useMemo(() => {
    const currentYear = getYear(new Date());
    const endYear = 2030;
    let startYear = currentYear;
    
    if (!loading && data.transactions.length > 0) {
      const transactionYears = data.transactions.map(t => getYear(new Date(t.date)));
      const minTransactionYear = Math.min(...transactionYears);
      startYear = Math.min(minTransactionYear, currentYear);
    }
    
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
        years.push(String(year));
    }
    
    return years;
  }, [data.transactions, loading]);

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const year = parseInt(selectedYear);
      const monthDate = setMonth(new Date(year, 0, 1), i);
      return {
        value: format(monthDate, 'yyyy-MM'),
        label: format(monthDate, 'MMMM'),
      };
    });
  }, [selectedYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const currentMonthIndex = selectedMonth !== 'all-months' && selectedMonth !== 'custom' 
      ? parse(selectedMonth, 'yyyy-MM', new Date()).getMonth() 
      : new Date().getMonth();
      
    const newMonthValue = `${year}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    
    // Check if we are staying on a specific month or going to "all"
    if (selectedMonth !== 'all-months' && selectedMonth !== 'custom') {
       handleMonthChange(`${year}-${format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MM')}`);
    } else {
       handleMonthChange('all-months');
       const yearDate = new Date(parseInt(year), 0, 1);
       setDateRange({ from: startOfYear(yearDate), to: endOfYear(yearDate) });
    }
  };

  const handleMonthChange = (monthValue: string) => {
    setSelectedMonth(monthValue);
    if (monthValue === 'all-months') {
      const yearDate = new Date(parseInt(selectedYear), 0, 1);
      setDateRange({ from: startOfYear(yearDate), to: endOfYear(yearDate) });
    } else if (monthValue === 'custom') {
      // Do nothing, date range is already custom and managed by DateRangePicker
    }
    else {
      const monthDate = parse(monthValue, 'yyyy-MM', new Date());
      setDateRange({
        from: startOfMonth(monthDate),
        to: endOfMonth(monthDate),
      });
    }
  };

  const { filteredTransactions, totalIncome, totalExpense } = useMemo(() => {
    const from = dateRange?.from ? new Date(dateRange.from.setHours(0,0,0,0)) : undefined;
    const to = dateRange?.to ? new Date(dateRange.to.setHours(23,59,59,999)) : undefined;

    const transactions = data.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isDateInRange = (!from || transactionDate >= from) && (!to || transactionDate <= to);
      const isTypeMatch = typeFilter === 'all' || t.type === typeFilter;
      const isCategoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
      return isDateInRange && isTypeMatch && isCategoryMatch;
    });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    return { filteredTransactions: transactions, totalIncome: income, totalExpense: expense };

  }, [data.transactions, dateRange, typeFilter, categoryFilter]);
  
  const availableCategories = useMemo(() => {
    if (typeFilter === 'all') {
      return ['all', ...data.categories.income, ...data.categories.expense];
    }
    return ['all', ...data.categories[typeFilter]];
  }, [typeFilter, data.categories]);

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as 'all' | 'income' | 'expense');
    setCategoryFilter('all'); // Reset category filter when type changes
  };

  const getTranslatedCategory = (category: string) => {
    const incomeKey = `categories_income_${category.toLowerCase().replace(/\s+/g, '')}`;
    const expenseKey = `categories_expense_${category.toLowerCase().replace(/\s+/g, '')}`;
    const translatedIncome = t(incomeKey);
    const translatedExpense = t(expenseKey);
    if(translatedIncome !== incomeKey) return translatedIncome;
    if(translatedExpense !== expenseKey) return translatedExpense;
    return category;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const tableColumn = [t('transactionTable_col_date'), t('transactionTable_col_description'), t('transactionTable_col_category'), t('reports_col_type'), t('transactionTable_col_amount')];
    const tableRows: (string | number)[][] = [];
    
    filteredTransactions.forEach(transaction => {
      const transactionData = [
        format(new Date(transaction.date), "yyyy-MM-dd"),
        transaction.description,
        getTranslatedCategory(transaction.category),
        t(`addTransaction_type_${transaction.type}`),
        formatCurrency(transaction.amount),
      ];
      tableRows.push(transactionData);
    });

    const dateFrom = dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : 'start';
    const dateTo = dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : 'today';

    doc.setFontSize(18);
    doc.text(t('reports_title'), 14, 22);
    doc.setFontSize(12);
    doc.text(`${t('reports_dateRange')}: ${dateFrom} to ${dateTo}`, 14, 30);
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { font: "HindSiliguri" }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`${t('dashboard_totalIncome')}: ${formatCurrency(totalIncome)}`, 14, finalY + 10);
    doc.text(`${t('dashboard_totalExpenses')}: ${formatCurrency(totalExpense)}`, 14, finalY + 17);
    doc.text(`${t('dashboard_currentBalance')}: ${formatCurrency(totalIncome - totalExpense)}`, 14, finalY + 24);

    doc.save(`report_${dateFrom}_-_${dateTo}.pdf`);
  };

  const generateExcel = () => {
    const worksheetData = filteredTransactions.map(transaction => ({
        [t('transactionTable_col_date')]: format(new Date(transaction.date), "yyyy-MM-dd"),
        [t('transactionTable_col_description')]: transaction.description,
        [t('transactionTable_col_category')]: getTranslatedCategory(transaction.category),
        [t('reports_col_type')]: transaction.type,
        [t('transactionTable_col_amount')]: transaction.amount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('header_reports'));
    
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-10 w-full sm:w-64"/>
            <Skeleton className="h-10 w-full sm:w-48"/>
            <Skeleton className="h-10 w-full sm:w-48"/>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-96 w-full"/>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <SmartSearch allTransactions={data.transactions} />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('reports_title')}</CardTitle>
            <CardDescription>
              {t('reports_desc')}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">{t('reports_filters')}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                    <DateRangePicker dateRange={dateRange} setDateRange={handleDateRangeChange} />
                </div>
                <div className="flex gap-2 lg:col-span-2">
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                      <SelectTrigger className="w-full sm:w-[120px]">
                          <SelectValue placeholder={t('reports_filter_year_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                          {availableYears.map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder={t('reports_filter_month_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all-months">{t('reports_filter_month_all')}</SelectItem>
                          {availableMonths.map(month => (
                              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                          ))}
                           {selectedMonth === 'custom' && (
                            <SelectItem value="custom" disabled>Custom Range</SelectItem>
                          )}
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4 lg:col-span-2">
                  <Select value={typeFilter} onValueChange={handleTypeChange}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder={t('reports_filter_type_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">{t('reports_filter_type_all')}</SelectItem>
                          <SelectItem value="income">{t('addTransaction_type_income')}</SelectItem>
                          <SelectItem value="expense">{t('addTransaction_type_expense')}</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={typeFilter === 'all' && categoryFilter === 'all'}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder={t('reports_filter_category_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">{t('reports_filter_category_all')}</SelectItem>
                          {availableCategories.slice(1).map(cat => (
                              <SelectItem key={cat} value={cat}>{getTranslatedCategory(cat)}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
              </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard_totalIncome')}</CardTitle>
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard_totalExpenses')}</CardTitle>
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard_currentBalance')}</CardTitle>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpense)}</div>
                </CardContent>
            </Card>
          </div>
        
          {typeFilter !== 'income' && (
            <>
              <Separator />
              <h3 className="text-lg font-semibold">{t('reports_spendingByCategory_title')}</h3>
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
            </>
          )}

        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>{t('reports_filteredTransactions_title')}</CardTitle>
            <CardDescription>{t('reports_filteredTransactions_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <ReportsDataTable transactions={filteredTransactions} />
        </CardContent>
      </Card>

    </div>
  );
}
