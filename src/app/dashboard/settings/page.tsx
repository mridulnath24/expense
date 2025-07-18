
'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus, Download, RefreshCw, User, Database } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useLanguage } from '@/context/language-context';
import { type Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { data, loading, addCategory, updateCategory, deleteCategory, exportData, resetData } = useData();
  const { user, username, loading: authLoading, updateUserProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryType, setAddCategoryType] = useState<'income' | 'expense'>('expense');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  useEffect(() => {
    if (username) {
      const nameParts = username.split(' ');
      profileForm.reset({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      });
    }
  }, [username, profileForm]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      await updateUserProfile(values.firstName, values.lastName);
      toast({
        title: t('toast_profileUpdated_title'),
        description: t('toast_profileUpdated_desc'),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t('toast_profileUpdateFailed_title'),
        description: t('toast_profileUpdateFailed_desc'),
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (category: Category) => {
    setCurrentCategory(category);
    setNewCategoryName(category.name);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = () => {
    if (currentCategory && newCategoryName.trim()) {
      updateCategory(currentCategory.type, currentCategory.name, newCategoryName.trim());
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      setNewCategoryName('');
    }
  };
  
  const handleDeleteCategory = (category: Category) => {
    deleteCategory(category.type, category.name);
  };

  const openAddModal = (type: 'income' | 'expense') => {
    setAddCategoryType(type);
    setNewCategoryName('');
    setIsAddModalOpen(true);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(addCategoryType, newCategoryName.trim());
      setIsAddModalOpen(false);
      setNewCategoryName('');
    }
  };

  const handleResetData = () => {
    resetData();
    toast({
        title: t('toast_dataReset_title'),
        description: t('toast_dataReset_desc')
    });
  }

  const renderCategoryList = (type: 'income' | 'expense') => {
    const categories = data.categories[type].map(name => ({ name, type }));
    const title = type === 'income' ? t('settings_incomeCategories') : t('settings_expenseCategories');

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button size="sm" variant="outline" onClick={() => openAddModal(type)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('settings_addCategory_button')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between rounded-md border p-3">
                <span>{t(`categories_${type}_${category.name.toLowerCase().replace(/\s+/g, '')}`, { defaultValue: category.name })}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(category)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t('settings_edit')}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('settings_delete')}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteDialog_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('settings_delete_desc', { category: category.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('deleteDialog_cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCategory(category)} className="bg-destructive hover:bg-destructive/90">
                          {t('deleteDialog_delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (loading || authLoading) {
      return (
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                      <Skeleton className="h-60 w-full" />
                      <Skeleton className="h-60 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings_title')}</CardTitle>
          <CardDescription>{t('settings_desc')}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5"/>
                    <CardTitle>{t('settings_profile_title')}</CardTitle>
                </div>
                <CardDescription>{t('settings_profile_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('signUp_firstName_label')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('signUp_lastName_label')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {t('settings_profile_button')}
                    </Button>
                </form>
                </Form>
            </CardContent>
          </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Database className="h-5 w-5"/>
                        <CardTitle>{t('settings_data_title')}</CardTitle>
                    </div>
                    <CardDescription>{t('settings_data_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 rounded-lg border p-4 items-start sm:items-center justify-between">
                       <div>
                         <h4 className="font-semibold">{t('settings_data_export_title')}</h4>
                         <p className="text-sm text-muted-foreground">{t('settings_data_export_desc')}</p>
                       </div>
                       <Button variant="outline" onClick={exportData}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('settings_data_export_button')}
                       </Button>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4 rounded-lg border border-destructive/50 p-4 items-start sm:items-center justify-between">
                       <div>
                         <h4 className="font-semibold text-destructive">{t('settings_data_reset_title')}</h4>
                         <p className="text-sm text-destructive/80">{t('settings_data_reset_desc')}</p>
                       </div>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <RefreshCw className="mr-2 h-4 w-4"/>
                                {t('settings_data_reset_button')}
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>{t('deleteDialog_title')}</AlertDialogTitle>
                                  <AlertDialogDescription>{t('settings_data_reset_confirm')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>{t('deleteDialog_cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">
                                      {t('settings_data_reset_confirm_button')}
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {renderCategoryList('income')}
        {renderCategoryList('expense')}
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings_editCategory_title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('addCategory_placeholder')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                 {t('deleteDialog_cancel')}
                </Button>
            </DialogClose>
            <Button onClick={handleUpdateCategory}>{t('addTransaction_button_edit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Category Modal */}
       <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addCategory_title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('addCategory_placeholder')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                 {t('deleteDialog_cancel')}
                </Button>
            </DialogClose>
            <Button onClick={handleAddCategory}>{t('addCategory_button')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
