import { Donation } from '../types';
import { getSourceDetails } from '../utils/formatters';

// Admin exports contain real donor names (including donors marked anonymous).
// Libraries are loaded on demand so they don't weigh down the admin bundle.

const today = () => new Date().toISOString().split('T')[0];

// "Phase 2" -> "phase2" for file names
const fileTag = (label: string) => label.toLowerCase().replace(/\s+/g, '');

// English-only label ("Bank Transfer (بینک)" -> "Bank Transfer"): the PDF's built-in fonts can't render Urdu
const sourceLabel = (d: Donation) => getSourceDetails(d.source).label.split(' (')[0];

export const exportDonationsToExcel = async (donations: Donation[], phaseLabel: string) => {
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
  }).toFile(`awami_road_donations_${fileTag(phaseLabel)}_${today()}.xlsx`);
};

// jsPDF's built-in fonts have no Urdu glyphs and it can't shape Urdu (joined letters, right-to-left)
// even with an embedded font. So cells containing Urdu are drawn by the browser onto a canvas in
// Noto Nastaliq Urdu (already loaded by admin/index.html) and placed in the PDF as images.
const URDU_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const URDU_FONT = '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif';
const URDU_PT = 8.5; // font size in PDF points
const URDU_LINE = URDU_PT * 2; // Nastaliq needs tall lines
const RENDER_SCALE = 4; // canvas pixels per PDF point, for sharp print

interface UrduImage { data: string; width: number; height: number }

const renderUrdu = (text: string, maxWidth: number): UrduImage => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const font = `${URDU_PT * RENDER_SCALE}px ${URDU_FONT}`;
  ctx.font = font;
  const limit = maxWidth * RENDER_SCALE;

  // Word-wrap to the column width
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > limit) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }

  const widest = Math.min(limit, Math.max(...lines.map(l => ctx.measureText(l).width)));
  canvas.width = Math.ceil(widest) + 2;
  canvas.height = Math.ceil(lines.length * URDU_LINE * RENDER_SCALE);
  ctx.font = font; // resizing the canvas resets its state
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgb(60, 60, 60)';
  lines.forEach((l, i) => ctx.fillText(l, canvas.width - 1, (i + 0.55) * URDU_LINE * RENDER_SCALE));

  return { data: canvas.toDataURL('image/png'), width: canvas.width / RENDER_SCALE, height: canvas.height / RENDER_SCALE };
};

export const exportDonationsToPDF = async (donations: Donation[], phaseLabel: string) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    document.fonts.load(`16px ${URDU_FONT}`, 'اردو').catch(() => undefined),
  ]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const fmt = (n: number) => n.toLocaleString('en-PK');
  const padding = 4;

  // Fixed widths (A4 landscape minus 40pt margins = 762pt) so Urdu cells can be rendered to fit
  const columnWidths = [28, 62, 170, 80, 140, 72, 70, 140];
  const urduImages = new Map<string, UrduImage>();

  doc.setFontSize(16);
  doc.text(`PAKS Unity Road - ${phaseLabel} Donations Ledger`, 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated ${today()}  |  ${donations.length} donations  |  Total Rs. ${fmt(total)}`, 40, 58);

  autoTable(doc, {
    startY: 72,
    margin: { left: 40, right: 40 },
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
    styles: { fontSize: 8, cellPadding: padding, valign: 'middle' },
    headStyles: { fillColor: [4, 120, 87] },
    footStyles: { fillColor: [236, 253, 245], textColor: [6, 78, 59], fontStyle: 'bold' },
    columnStyles: {
      ...Object.fromEntries(columnWidths.map((w, i) => [i, { cellWidth: w }])),
      6: { cellWidth: columnWidths[6], halign: 'right' },
    },
    showFoot: 'lastPage',
    rowPageBreak: 'avoid', // keep each Urdu image on one page
    didParseCell: data => {
      if (data.section === 'foot' && data.column.index === 6) data.cell.styles.halign = 'right';
      if (data.section !== 'body') return;
      const text = String(data.cell.raw ?? '');
      if (!URDU_RE.test(text)) return;
      const img = renderUrdu(text, columnWidths[data.column.index] - padding * 2);
      urduImages.set(`${data.row.index}:${data.column.index}`, img);
      data.cell.text = []; // drawn as an image in didDrawCell instead
      data.cell.styles.minCellHeight = img.height + padding * 2;
    },
    didDrawCell: data => {
      if (data.section !== 'body') return;
      const img = urduImages.get(`${data.row.index}:${data.column.index}`);
      if (!img) return;
      // Right-aligned, vertically centred
      const x = data.cell.x + data.cell.width - padding - img.width;
      const y = data.cell.y + (data.cell.height - img.height) / 2;
      doc.addImage(img.data, 'PNG', x, y, img.width, img.height, undefined, 'FAST');
    },
  });

  doc.save(`awami_road_donations_${fileTag(phaseLabel)}_${today()}.pdf`);
};
