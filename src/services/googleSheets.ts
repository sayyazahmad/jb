import { Donation, PaymentSource } from '../types';

export interface SheetSyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsCount: number;
  message?: string;
}

const STORAGE_KEY_SPREADSHEET_ID = 'awami_road_google_sheet_id';

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
};

export const saveSpreadsheetId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, id);
};

export const clearSavedSpreadsheetId = () => {
  localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
};

/**
 * Creates a new dedicated Google Sheet for the Awami Road project
 */
export const createDonationsSpreadsheet = async (accessToken: string): Promise<{ id: string; url: string }> => {
  const title = `AWAMI ROAD (Jeeva Morh to Butti) - Official Donations Ledger`;

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: 'Donations',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  saveSpreadsheetId(spreadsheetId);
  return { id: spreadsheetId, url: spreadsheetUrl };
};

/**
 * Syncs (overwrites) all donation records to the Google Sheet
 */
export const syncAllDonationsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  donations: Donation[]
): Promise<SheetSyncResult> => {
  const headers = [
    'SR #',
    'Receipt Number',
    'Date',
    'Donor Name',
    'Village Name',
    'Donation Amount (PKR)',
    'Payment Source',
    'Reference / TRX ID',
    'Notes / Material / Dua',
    'Verified / Received By'
  ];

  // Map donations to rows
  const rows = donations.map((d, idx) => [
    idx + 1,
    d.receiptNumber || `AR-${idx + 1}`,
    d.date,
    d.donorName,
    d.villageName,
    d.amount,
    d.source,
    d.reference || '',
    d.notes || '',
    d.verifiedBy || ''
  ]);

  const allValues = [headers, ...rows];

  // 1. Clear existing contents to prevent stale rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Donations!A1:J${Math.max(5000, donations.length + 100)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // 2. Write all values
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Donations!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Donations!A1',
        majorDimension: 'ROWS',
        values: allValues
      })
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json();
    throw new Error(err.error?.message || 'Failed to update Google Sheet values');
  }

  // 3. Optional header styling with batchUpdate
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 10
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.02, green: 0.38, blue: 0.25 }, // Forest Green
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      })
    });
  } catch (e) {
    // Styling is non-critical
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    rowsCount: donations.length
  };
};

/**
 * Appends a single newly collected donation directly to the Google Sheet
 */
export const appendSingleDonationToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  donation: Donation,
  srNumber: number
): Promise<boolean> => {
  const row = [
    srNumber,
    donation.receiptNumber,
    donation.date,
    donation.donorName,
    donation.villageName,
    donation.amount,
    donation.source,
    donation.reference || '',
    donation.notes || '',
    donation.verifiedBy || ''
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Donations!A:J:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Donations!A:J',
        majorDimension: 'ROWS',
        values: [row]
      })
    }
  );

  return res.ok;
};

/**
 * Reads all rows from the Google Sheet
 */
export const fetchDonationsFromSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<Donation[]> => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Donations!A2:J5000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch rows from Google Sheet');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, idx) => {
    const receiptNumber = row[1] || `AR-${idx + 1}`;
    const date = row[2] || new Date().toISOString().split('T')[0];
    const donorName = row[3] || 'Anonymous';
    const villageName = row[4] || 'Khushi Kot';
    const amount = parseInt(String(row[5]).replace(/[^0-9]/g, ''), 10) || 0;
    const source: PaymentSource = ['Cash', 'BankTransfer', 'Easypesa', 'Jazzcash'].includes(row[6])
      ? (row[6] as PaymentSource)
      : 'Easypesa';
    const reference = row[7] || '';
    const notes = row[8] || '';
    const verifiedBy = row[9] || '';

    return {
      id: `sheet-don-${idx + 1}-${Date.now()}`,
      donorName,
      villageName,
      source,
      reference,
      date,
      amount,
      notes,
      verifiedBy,
      receiptNumber,
      createdAt: new Date(date).getTime() || Date.now()
    };
  });
};
