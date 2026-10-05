import { Donation, PaymentSource } from '../types';

export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

export function formatLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Crore`;
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} Lakh`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return `${amount}`;
}

export function getSourceDetails(source: PaymentSource): {
  label: string;
  labelUrdu: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: 'cash' | 'bank' | 'easypaisa' | 'jazzcash';
} {
  switch (source) {
    case 'Cash':
      return {
        label: 'Cash (نقد)',
        labelUrdu: 'نقد',
        color: '#16a34a',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
        badgeText: 'text-emerald-700 dark:text-emerald-400',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
        iconName: 'cash'
      };
    case 'Easypesa':
      return {
        label: 'EasyPaisa (ایزی پیسہ)',
        labelUrdu: 'ایزی پیسہ',
        color: '#10b981',
        badgeBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300',
        badgeText: 'text-teal-700 dark:text-teal-400',
        badgeBorder: 'border-teal-200 dark:border-teal-800/60',
        iconName: 'easypaisa'
      };
    case 'Jazzcash':
      return {
        label: 'JazzCash (جاز کیش)',
        labelUrdu: 'جاز کیش',
        color: '#ea580c',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
        badgeText: 'text-amber-700 dark:text-amber-400',
        badgeBorder: 'border-amber-200 dark:border-amber-800/60',
        iconName: 'jazzcash'
      };
    case 'BankTransfer':
      return {
        label: 'Bank Transfer (بینک)',
        labelUrdu: 'بینک ٹرانسفر',
        color: '#2563eb',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300',
        badgeText: 'text-blue-700 dark:text-blue-400',
        badgeBorder: 'border-blue-200 dark:border-blue-800/60',
        iconName: 'bank'
      };
    case 'Material':
      return {
        label: 'Material (سامان)',
        labelUrdu: 'سامان',
        color: '#7c3aed',
        badgeBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300',
        badgeText: 'text-violet-700 dark:text-violet-400',
        badgeBorder: 'border-violet-200 dark:border-violet-800/60',
        iconName: 'cash'
      };
    case 'Remaining':
      return {
        label: 'Remaining (بقایا)',
        labelUrdu: 'بقایا',
        color: '#e11d48',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300',
        badgeText: 'text-rose-700 dark:text-rose-400',
        badgeBorder: 'border-rose-200 dark:border-rose-800/60',
        iconName: 'cash'
      };
    default:
      return {
        label: source,
        labelUrdu: source,
        color: '#64748b',
        badgeBg: 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200',
        badgeText: 'text-slate-700 dark:text-slate-300',
        badgeBorder: 'border-slate-200 dark:border-slate-800',
        iconName: 'cash'
      };
  }
}

export function generateWhatsAppReceiptText(donation: Donation, projectName: string = 'AWAMI ROAD'): string {
  return `*${projectName.toUpperCase()} (Jeeva Morh to Butti)*%0A` +
    `*عوامی سڑک فنڈ - آفیشل رسید*%0A` +
    `--------------------------------%0A` +
    `*Receipt #:* ${donation.receiptNumber}%0A` +
    `*Donor Name:* ${donation.donorName}%0A` +
    `*Village:* ${donation.villageName}%0A` +
    `*Amount:* ${formatPKR(donation.amount)}%0A` +
    `*Payment Source:* ${donation.source}%0A` +
    `*Reference / Note:* ${donation.reference || 'N/A'}%0A` +
    `*Date:* ${donation.date}%0A` +
    (donation.verifiedBy ? `*Received By:* ${donation.verifiedBy}%0A` : '') +
    `--------------------------------%0A` +
    `JazakAllah Khair! May Allah accept this Sadaqah Jariyah for our village road.`;
}

export function exportDonationsToCSV(donations: Donation[], filename: string = 'awami_road_donations.csv'): void {
  // Add UTF-8 BOM so Excel opens Urdu and special characters cleanly
  const BOM = '\uFEFF';
  const headers = ['Receipt #', 'Donor Name', 'Village', 'Amount (PKR)', 'Payment Source', 'Reference', 'Date', 'Received / Verified By', 'Notes'];
  
  const rows = donations.map((d) => [
    `"${d.receiptNumber}"`,
    `"${d.donorName.replace(/"/g, '""')}"`,
    `"${d.villageName.replace(/"/g, '""')}"`,
    d.amount,
    `"${d.source}"`,
    `"${(d.reference || '').replace(/"/g, '""')}"`,
    `"${d.date}"`,
    `"${(d.verifiedBy || '').replace(/"/g, '""')}"`,
    `"${(d.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
