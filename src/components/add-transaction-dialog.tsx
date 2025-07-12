'use client';

import { useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { suggestExpenseCategory } from '@/ai/flows/suggest-expense-category';
import { type Transaction } from '@/lib/types';

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
  const [isSuggesting, setIsSuggesting] = useState(false);
  const isEditMode = !!transaction;

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

  const handleSuggestCategory = async () => {
    const description = form.getValues('description');
    if (!description) {
      toast({
        title: 'Description needed',
        description: 'Please enter a description to suggest a category.',
        variant: 'destructive',
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await suggestExpenseCategory({ expenseDescription: description });
      if (result.suggestedCategory) {
        const category = result.suggestedCategory;
        form.setValue('category', category, { shouldValidate: true });

        // Add to category list if it's new
        if (!data.categories.expense.includes(category)) {
          addCategory('expense', category);
        }

        toast({
          title: 'Category Suggested!',
          description: `We've set the category to "${category}".`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Suggestion Failed',
        description: 'Could not suggest a category at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };


  const onSubmit = (values: FormValues) => {
    if (isEditMode && transaction) {
       updateTransaction({
        ...transaction,
        ...values,
        date: values.date.toISOString(),
      });
      toast({
        title: 'Transaction Updated',
        description: 'Your transaction has been successfully updated.',
      });
    } else {
      addTransaction({
        ...values,
        date: values.date.toISOString(),
      });
      toast({
        title: 'Transaction Added',
        description: 'Your transaction has been successfully recorded.',
      });
    }

    onOpenChange(false);
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
          <DialogTitle>{isEditMode ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of your transaction.' : 'Enter the details of your income or expense below.'}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coffee with friends" {...field} />
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
                  <FormLabel>Category</FormLabel>
                   <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(transactionType === 'income' ? data.categories.income : data.categories.expense).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {transactionType === 'expense' && (
                       <Button type="button" variant="outline" size="icon" onClick={handleSuggestCategory} disabled={isSuggesting}>
                        {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary" />}
                        <span className="sr-only">Suggest Category</span>
                      </Button>
                    )}
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
                  <FormLabel>Date</FormLabel>
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
                            <span>Pick a date</span>
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
              <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isEditMode ? 'Save Changes' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}