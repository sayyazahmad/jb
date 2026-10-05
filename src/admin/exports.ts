import { Donation } from '../types';
import { getSourceDetails } from '../utils/formatters';

// Admin exports contain real donor names (including donors marked anonymous).
// Libraries are loaded on demand so they don't weigh down the admin bundle.

const today = () => new Date().toISOString().split('T')[0];

// English-only label ("Bank Transfer (بینک)" -> "Bank Transfer"): the PDF's built-in fonts can't render Urdu
const sourceLabel = (d: Donation) => getSourceDetails(d.source).label.split(' (')[0];

export const exportDonationsToExcel = async (donations: Donation[]) => {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const header = (value: string) => ({ value, fontWeight: 'bold' as const });

  const sheetData = [
    ['Date', 'Donor Name', 'Anonymous', 'Village', 'Reference', 'Source', 'Amount (PKR)', 'Transaction ID / Note', 'Notes', 'Verified By'].map(header),
    ...donations.map(d => [
      d.date,
      d.donorName,
      d.isAnonymous ? 'Yes' : '',
      d.villageName,
      d.referredBy || '',
      sourceLabel(d),
      { value: d.amount, format: '#,##0' },
      d.reference || '',
      d.notes || '',
      d.verifiedBy || '',
    ]),
    [
      header('Total'), null, null, null, null, null,
      { value: donations.reduce((sum, d) => sum + d.amount, 0), format: '#,##0', fontWeight: 'bold' as const },
      null, null, null,
    ],
  ];

  await writeXlsxFile(sheetData, {
    sheet: 'Donations',
    columns: [{ width: 12 }, { width: 32 }, { width: 11 }, { width: 16 }, { width: 22 }, { width: 15 }, { width: 14 }, { width: 24 }, { width: 36 }, { width: 18 }],
    stickyRowsCount: 1,
  }).toFile(`awami_road_donations_${today()}.xlsx`);
};

export const exportDonationsToPDF = async (donations: Donation[]) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const fmt = (n: number) => n.toLocaleString('en-PK');

  doc.setFontSize(16);
  doc.text('Awami Road - Donations Ledger', 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated ${today()}  |  ${donations.length} donations  |  Total Rs. ${fmt(total)}`, 40, 58);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Date', 'Donor Name', 'Village', 'Reference', 'Source', 'Amount (Rs.)', 'Notes']],
    body: donations.map((d, i) => [
      i + 1,
      d.date,
      d.isAnonymous ? `${d.donorName} (anonymous)` : d.donorName,
      d.villageName,
      d.referredBy || '',
      sourceLabel(d),
      fmt(d.amount),
      d.notes || '',
    ]),
    foot: [['', '', 'Total', '', '', '', fmt(total), '']],
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [4, 120, 87] },
    footStyles: { fillColor: [236, 253, 245], textColor: [6, 78, 59], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 28 }, 6: { halign: 'right' }, 7: { cellWidth: 170 } },
    showFoot: 'lastPage',
  });

  doc.save(`awami_road_donations_${today()}.pdf`);
};
