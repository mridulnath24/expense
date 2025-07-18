
'use client';

import { useState } from 'react';
import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus } from 'lucide-react';
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

export default function SettingsPage() {
  const { data, loading, addCategory, updateCategory, deleteCategory } = useData();
  const { t } = useLanguage();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryType, setAddCategoryType] = useState<'income' | 'expense'>('expense');

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
    // Prevent deleting default/base categories
    const defaultCategories = ['Salary', 'Bonus', 'Gifts', 'Freelance', 'Food', 'Transport', 'Utilities', 'House Rent', 'Entertainment', 'Health', 'Shopping', 'Other', 'Grocery', 'DPS', 'EMI', 'Medical', 'Electricity Bill', 'Gas Bill', 'Wifi Bill'];
    if (defaultCategories.includes(category.name)) {
        alert(t('settings_deleteDefault_error'));
        return;
    }
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
  
  if (loading) {
      return (
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-48 w-full" />
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
