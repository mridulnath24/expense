
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils.ts';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { type Transaction } from '@/lib/types';
import { useLanguage } from '@/context/language-context';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(2, 'Description is too short').max(100, 'Description is too long'),
  category: z.string().min(1, 'Please select a category'),
  date: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  transaction?: Transaction | null;
}

export function AddTransactionDialog({ open, onOpenChange, children, transaction }: AddTransactionDialogProps) {
  const { data, addTransaction, updateTransaction, addCategory } = useData();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isEditMode = !!transaction;
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      category: '',
      date: new Date(),
    },
  });
  
  const getTranslatedCategory = useCallback((categoryName: string, type: 'income' | 'expense') => {
    const originalKey = `categories_${type}_${categoryName.toLowerCase().replace(/\s+/g, '')}`;
    let translated = t(originalKey);
    
    if (translated === originalKey) {
        // try plural
        const pluralKey = `categories_${type}_${(categoryName + 's').toLowerCase().replace(/\s+/g, '')}`;
        translated = t(pluralKey);
        if(translated !== pluralKey) return translated;

        // try singular
        if (categoryName.endsWith('s')) {
          const singularKey = `categories_${type}_${(categoryName.slice(0,-1)).toLowerCase().replace(/\s+/g, '')}`;
          translated = t(singularKey);
          if(translated !== singularKey) return translated;
        }

        return categoryName; // Fallback to original name
    }
    
    return translated;
  }, [t]);

  useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        date: new Date(transaction.date)
      });
    } else {
      form.reset({
        type: 'expense',
        amount: 0,
        description: '',
        category: '',
        date: new Date(),
      });
    }
  }, [transaction, form, open]);


  const transactionType = form.watch('type');

  const onSubmit = (values: FormValues) => {
    if (isEditMode && transaction) {
       updateTransaction({
        ...transaction,
        ...values,
        date: values.date.toISOString(),
      });
      toast({
        title: t('toast_transactionUpdated_title'),
        description: t('toast_transactionUpdated_desc'),
      });
    } else {
      addTransaction({
        ...values,
        date: values.date.toISOString(),
      });
      toast({
        title: t('toast_transactionAdded_title'),
        description: t('toast_transactionAdded_desc'),
      });
    }

    onOpenChange(false);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(transactionType, newCategory.trim());
      form.setValue('category', newCategory.trim());
      setNewCategory('');
      setIsAddCategoryOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        form.reset();
      }
    }}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('addTransaction_title_edit') : t('addTransaction_title_add')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('addTransaction_desc_edit') : t('addTransaction_desc_add')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('category', '');
                      }} 
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('addTransaction_type_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">{t('addTransaction_type_expense')}</SelectItem>
                        <SelectItem value="income">{t('addTransaction_type_income')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addTransaction_amount_label')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={t('addTransaction_amount_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addTransaction_description_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addTransaction_description_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addTransaction_category_label')}</FormLabel>
                   <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('addTransaction_category_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(transactionType === 'income' ? data.categories.income : data.categories.expense).map(cat => (
                          <SelectItem key={cat} value={cat}>{getTranslatedCategory(cat, transactionType)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AlertDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsAddCategoryOpen(true)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('addCategory_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('addCategory_desc', { type: t(`addTransaction_type_${transactionType}`) })}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input 
                                value={newCategory} 
                                onChange={(e) => setNewCategory(e.target.value)} 
                                placeholder={t('addCategory_placeholder')}
                                autoFocus
                            />
                            <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setNewCategory('')}>{t('deleteDialog_cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAddCategory}>{t('addCategory_button')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('addTransaction_date_label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{t('addTransaction_date_placeholder')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isEditMode ? t('addTransaction_button_edit') : t('addTransaction_button_add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
