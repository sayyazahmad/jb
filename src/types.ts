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
  receiptNumber: string;
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
  adminPin: string;
  adminUsername?: string;
  adminPassword?: string;
  committeeMembers: CommitteeMember[];
  announcements: string[];
}
