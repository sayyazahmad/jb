export type PaymentSource = 'Cash' | 'BankTransfer' | 'Easypesa' | 'Jazzcash' | 'Material' | 'Remaining';

export interface Donation {
  id: string;
  donorName: string;
  villageName: string;
  source: PaymentSource;
  reference: string;
  date: string; // YYYY-MM-DD
  amount: number; // in PKR / RS
  notes?: string;
  isAnonymous?: boolean; // Shown as "Anonymous" in the public view; admins see the real name
  verifiedBy?: string;
  referredBy?: string; // Person the donation came through — admin only, never shown publicly
  createdAt: number;
}

export interface RoadMilestone {
  id: string;
  title: string;
  titleUrdu?: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned';
  costEstimate?: number;
  lengthCompletedKm?: number;
}

export interface CommitteeMember {
  name: string;
  role: string;
  village: string;
  phone: string;
  accountInfo?: string;
}

export interface ProjectSettings {
  projectName: string;
  projectNameUrdu: string;
  routeDescription: string;
  targetGoal: number; // in PKR
  roadLengthKm: number;
  committeeMembers: CommitteeMember[];
  announcements: string[];
}

export type ExpenseType = 'Material' | 'Labour' | 'Machinery' | 'Transport' | 'Other';

export interface Expense {
  id: string; // sequential number assigned by the database (shown as Expense #)
  date: string; // YYYY-MM-DD
  type: ExpenseType;
  description: string; // e.g. "Cement", "Labour – excavation"
  quantity?: number; // e.g. 200 (bags), 30 (worker-days), 8 (hours)
  unit?: string; // e.g. "bags", "worker-days", "hours", "trips"
  rate?: number; // PKR per unit
  amount: number; // PKR total
  payee?: string; // vendor / worker / operator paid
  paymentMethod?: string; // Cash, Bank Transfer, EasyPaisa, ...
  notes?: string;
  receipts: string[]; // storage paths in the "receipts" bucket
  createdAt: number;
  updatedAt?: number;
}
