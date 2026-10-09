import { useEffect, useState } from 'react';
import { Expense } from '../types';
import { supabase } from '../services/supabase';
import {
  fetchExpenses,
  insertExpense,
  updateExpense,
  deleteExpense,
  subscribeToExpenseChanges,
} from '../services/expenses';

const STORAGE_KEY_EXPENSES = 'awami_road_expenses_v1';

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

const byDateDesc = (a: Expense, b: Expense) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id);

/** Shared expense store for the public and admin apps (same pattern as useDonations) */
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    } catch {
      // ignore (quota / private mode)
    }
  }, [expenses]);

  useEffect(() => {
    fetchExpenses()
      .then(remote => setExpenses(remote))
      .catch(err => console.warn('Expenses fetch skipped:', err.message))
      .finally(() => setIsLoaded(true));

    const upsertLocal = (expense: Expense) =>
      setExpenses(prev => [...prev.filter(e => e.id !== expense.id), expense].sort(byDateDesc));

    const channel = subscribeToExpenseChanges(upsertLocal, id => setExpenses(prev => prev.filter(e => e.id !== id)));
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveExpense = async (input: ExpenseInput): Promise<Expense> => {
    const { id, ...fields } = input;
    const existing = id ? expenses.find(e => e.id === id) : undefined;
    const saved = existing
      ? await updateExpense({ ...existing, ...fields, id: existing.id })
      : await insertExpense({ ...fields, createdAt: Date.now() });
    setExpenses(prev => [...prev.filter(e => e.id !== saved.id), saved].sort(byDateDesc));
    return saved;
  };

  const removeExpense = async (expense: Expense) => {
    await deleteExpense(expense);
    setExpenses(prev => prev.filter(e => e.id !== expense.id));
  };

  return { expenses, saveExpense, removeExpense, isLoaded };
};
