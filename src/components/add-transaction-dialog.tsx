'use client';

import 'regenerator-runtime/runtime';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
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
import { CalendarIcon, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { type Transaction } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { suggestExpenseCategory } from '@/ai/flows/suggest-expense-category';
import { parseTransactionFromText } from '@/ai/flows/parse-transaction-from-text';

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
  const { data, addTransaction, updateTransaction } = useData();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const isEditMode = !!transaction;
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

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

  // Effect to parse transcript when user stops speaking
  useEffect(() => {
    if (!listening && transcript) {
      handleParseTranscript();
    }
  }, [listening, transcript]);
  
  const handleVoiceListen = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false, language: locale });
    }
  };

  const handleParseTranscript = async () => {
    if (!transcript) return;
    setIsParsing(true);
    try {
      const result = await parseTransactionFromText({ text: transcript, locale });
      if (result) {
        form.setValue('type', result.type);
        form.setValue('amount', result.amount);
        form.setValue('description', result.description);
        
        // Auto-suggest category after parsing
        const suggestResult = await suggestExpenseCategory({
          description: result.description,
          categories: data.categories[result.type],
        });
        if (suggestResult.category && data.categories[result.type].includes(suggestResult.category)) {
          form.setValue('category', suggestResult.category);
        }

        toast({
          title: t('toast_voiceParsed_title'),
          description: t('toast_voiceParsed_desc'),
        });
      }
    } catch (error) {
       console.error("Failed to parse transcript:", error);
       toast({
          title: t('toast_voiceParse_fail_title'),
          description: t('toast_voiceParse_fail_desc'),
          variant: 'destructive'
       });
    } finally {
        setIsParsing(false);
        resetTranscript();
    }
  };


  const transactionType = form.watch('type');
  const descriptionValue = form.watch('description');

  const handleSuggestCategory = async () => {
    if (!descriptionValue) return;
    setIsSuggesting(true);
    try {
      const result = await suggestExpenseCategory({
        description: descriptionValue,
        categories: data.categories.expense,
      });
      if (result.category && data.categories.expense.includes(result.category)) {
        form.setValue('category', result.category);
        toast({
          title: t('toast_suggestCategory_title'),
          description: t('toast_suggestCategory_desc', { category: result.category }),
        });
      } else {
         toast({
          title: t('toast_suggestCategory_fail_title'),
          description: t('toast_suggestCategory_fail_desc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to suggest category:', error);
      toast({
        title: t('toast_suggestCategory_fail_title'),
        description: t('toast_suggestCategory_fail_desc'),
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
  
  const getTranslatedCategory = (category: string, type: 'income' | 'expense') => {
    const key = `categories_${type}_${category.toLowerCase().replace(/\s+/g, '')}`;
    const translated = t(key);
    return translated === key ? category : translated;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        form.reset();
        resetTranscript();
        SpeechRecognition.abortListening();
      }
    }}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('addTransaction_title_edit') : t('addTransaction_title_add')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('addTransaction_desc_edit') : listening ? t('addTransaction_desc_listening') : t('addTransaction_desc_add')}
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
                     {transactionType === 'expense' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleSuggestCategory}
                          disabled={isSuggesting || !descriptionValue}
                          title={t('addTransaction_suggestCategory_button')}
                        >
                          {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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
            <DialogFooter className="sm:justify-between gap-2">
                {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="outline" size="icon" onClick={handleVoiceListen} className={cn(listening && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}>
                        {listening ? <MicOff className="h-4 w-4" /> : isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                        <span className="sr-only">{listening ? "Stop listening" : "Start listening"}</span>
                    </Button>
                )}
              <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || isParsing}>
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
