import React from 'react';
import { ListOrdered, PlusCircle, Download, LogOut, ExternalLink, ArrowLeft, ReceiptText } from 'lucide-react';
import { Header } from '../components/Header';
import { useDonations, useSettings } from '../hooks/useDonations';
import { useExpenses } from '../hooks/useExpenses';
import { DonationForm } from './DonationForm';
import { BackupPanel } from './BackupPanel';
import { DonationGrid } from './DonationGrid';
import { ExpenseGrid } from './ExpenseGrid';
import { ExpenseForm } from './ExpenseForm';
import { AdminRoute, navigate, useAdminRoute } from './router';
import { AdminLogin } from './AdminLogin';
import { useAdminAuth } from './useAdminAuth';

// Old client-side "logged in" flag from before real Supabase Auth; remove it from browsers
try {
  localStorage.removeItem('awami_road_admin_auth_v2');
} catch {
  // ignore
}

const NAV_ITEMS: { route: AdminRoute; label: string; icon: React.ElementType }[] = [
  { route: { name: 'list' }, label: 'Donations', icon: ListOrdered },
  { route: { name: 'new' }, label: 'Add Donation', icon: PlusCircle },
  { route: { name: 'expenses' }, label: 'Expenses', icon: ReceiptText },
  { route: { name: 'backup' }, label: 'Backup', icon: Download },
];

export default function AdminApp() {
  const { donations, setDonations, saveDonation, deleteDonation, isLoaded } = useDonations();
  const { settings } = useSettings();
  const { expenses, saveExpense, removeExpense, isLoaded: expensesLoaded } = useExpenses();
  const route = useAdminRoute();

  // Supabase Auth session + admins-list check (the database enforces the same rule on writes)
  const auth = useAdminAuth();

  const handleLogout = async () => {
    await auth.signOut();
    navigate({ name: 'list' });
  };

  if (auth.status !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 pb-12">
        <Header />
        <AdminLogin
          status={auth.status}
          email={auth.email}
          onSignIn={auth.signIn}
          onSendReset={auth.sendPasswordReset}
          onSetPassword={auth.setNewPassword}
          onSignOut={auth.signOut}
        />
      </div>
    );
  }

  const isNavActive = (item: AdminRoute) =>
    item.name === route.name ||
    (item.name === 'list' && route.name === 'edit') ||
    (item.name === 'expenses' && (route.name === 'expenseNew' || route.name === 'expenseEdit'));

  const editingDonation = route.name === 'edit' ? donations.find(d => d.id === route.id) || null : null;
  const editingExpense = route.name === 'expenseEdit' ? expenses.find(e => e.id === route.id) || null : null;
  const toExpenses = () => navigate({ name: 'expenses' });

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 pb-12">
      <Header
        actions={
          <>
            <a
              href="/"
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-xl text-xs text-emerald-200 hover:text-white hover:bg-white/10 transition-colors items-center gap-1"
              title="Open public site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public site</span>
            </a>
            <button
              onClick={handleLogout}
              title={auth.email ? `Log out ${auth.email}` : 'Log out'}
              className="px-2.5 py-1.5 rounded-xl text-xs text-emerald-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        }
      >
        {/* Admin Navigation */}
        <nav className="flex items-center gap-1 mt-3 -mb-1 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mr-2 whitespace-nowrap">Admin</span>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isNavActive(item.route);
            return (
              <button
                key={item.route.name}
                onClick={() => navigate(item.route)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  active ? 'bg-white/15 text-white' : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </Header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {route.name === 'list' && (
          <DonationGrid
            donations={donations}
            onAddNew={() => navigate({ name: 'new' })}
            onEdit={(donation) => navigate({ name: 'edit', id: donation.id })}
          />
        )}

        {route.name === 'new' && (
          <DonationForm
            editingDonation={null}
            onSaveDonation={saveDonation}
            onDeleteDonation={deleteDonation}
            onDone={() => navigate({ name: 'list' })}
          />
        )}

        {route.name === 'edit' && !editingDonation && !isLoaded && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading donation…
          </div>
        )}

        {route.name === 'edit' && (editingDonation || isLoaded) && (
          editingDonation ? (
            <DonationForm
              key={editingDonation.id}
              editingDonation={editingDonation}
              onSaveDonation={saveDonation}
              onDeleteDonation={deleteDonation}
              onDone={() => navigate({ name: 'list' })}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">Donation not found. It may have been deleted.</p>
              <button
                onClick={() => navigate({ name: 'list' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to list</span>
              </button>
            </div>
          )
        )}

        {route.name === 'expenses' && (
          <ExpenseGrid
            expenses={expenses}
            onAddNew={() => navigate({ name: 'expenseNew' })}
            onEdit={(expense) => navigate({ name: 'expenseEdit', id: expense.id })}
          />
        )}

        {route.name === 'expenseNew' && (
          <ExpenseForm editingExpense={null} onSave={saveExpense} onDelete={removeExpense} onDone={toExpenses} />
        )}

        {route.name === 'expenseEdit' && (
          editingExpense ? (
            <ExpenseForm key={editingExpense.id} editingExpense={editingExpense} onSave={saveExpense} onDelete={removeExpense} onDone={toExpenses} />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {expensesLoaded ? 'Expense not found. It may have been deleted.' : 'Loading expense…'}
              </p>
              {expensesLoaded && (
                <button onClick={toExpenses} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to expenses</span>
                </button>
              )}
            </div>
          )
        )}

        {route.name === 'backup' && (
          <BackupPanel
            donations={donations}
            onImportData={setDonations}
          />
        )}
      </main>
    </div>
  );
}
