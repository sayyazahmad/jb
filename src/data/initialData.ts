import { ProjectSettings, RoadMilestone } from '../types';

export const INITIAL_SETTINGS: ProjectSettings = {
  projectName: 'AWAMI ROAD',
  projectNameUrdu: 'عوامی سڑک (جیوا موڑ تا بٹی)',
  routeDescription: 'Jeeva Morh to Butti',
  targetGoal: 4500000, // 45 Lakhs PKR Target
  roadLengthKm: 4.5,
  adminPin: '1234',
  adminUsername: 'admin',
  adminPassword: 'Ochor1!',
  committeeMembers: [
    {
      name: 'Tanveer Wilayat',
      role: 'Offline Collection Incharge / Central Representative',
      village: 'Khushi Kot',
      phone: '+92 300 0000000',
      accountInfo: 'EasyPaisa & Cash Collection Coordinator'
    },
    {
      name: 'Chaudhry Muhammad Riaz',
      role: 'Committee President',
      village: 'Surjal',
      phone: '+92 300 1234567',
      accountInfo: 'Central Committee'
    },
    {
      name: 'Malik Tariq Mehmood',
      role: 'Finance Secretary (Bank & Online Transfers)',
      village: 'Palak',
      phone: '+92 345 7654321',
      accountInfo: 'Bank Transfer Representative'
    },
    {
      name: 'Master Muhammad Aslam',
      role: 'Ledger Auditor',
      village: 'Kotli',
      phone: '+92 321 9876543',
      accountInfo: 'Verification Officer'
    }
  ],
  announcements: [
    '📢 Alhamdulillah! Over Rs 25.8 Lakhs (2,584,000) collected in donations from our villages and overseas brothers.',
    '⚠️ Every offline cash and EasyPaisa contribution is recorded in this verified ledger.'
  ]
};

export const INITIAL_MILESTONES: RoadMilestone[] = [
  {
    id: 'm1',
    title: 'Topographic Survey & Route Clearing',
    titleUrdu: 'زمین کی پیمائش اور راستہ کلیئرنگ',
    description: 'Marking road width (24 ft), clearing bushes and widening sharp turns.',
    status: 'completed',
    costEstimate: 280000,
    lengthCompletedKm: 4.5
  },
  {
    id: 'm2',
    title: 'Heavy Earthwork & Leveling',
    titleUrdu: 'مٹی بھرائی اور ٹریکٹر لیولنگ',
    description: 'Tractor-trolley earth hauling, cutting bumps and compacting subgrade.',
    status: 'completed',
    costEstimate: 850000,
    lengthCompletedKm: 4.5
  },
  {
    id: 'm3',
    title: 'Stone Soling & Base Gravel Course',
    titleUrdu: 'پتھر سولنگ اور روڑی کٹائی',
    description: 'Heavy stone pitching and river gravel compaction to prevent monsoon erosion.',
    status: 'in_progress',
    costEstimate: 1200000,
    lengthCompletedKm: 2.5
  },
  {
    id: 'm4',
    title: 'Rainwater Drainage Culverts (Pulian)',
    titleUrdu: 'نکاسی آب پلیاں اور سلورٹ تعمیر',
    description: 'Construction of reinforced pipe culverts at seasonal streams.',
    status: 'in_progress',
    costEstimate: 450000,
    lengthCompletedKm: 1.0
  },
  {
    id: 'm5',
    title: 'Final Asphalt Paving & Curbing',
    titleUrdu: 'تارکول / اسفالٹ کارپٹنگ',
    description: 'Bituminous surface dressing for lifetime village connectivity.',
    status: 'planned',
    costEstimate: 720000,
    lengthCompletedKm: 0.0
  }
];
