import { UserProfile, Assignment, ShotReport, Zone, Topic, SharafEventDef, SharafAllocation, MiqaatDef, DEFAULT_HR_PERMISSIONS } from '../types';

export const INITIAL_MIQAATS: MiqaatDef[] = [
  { id: 'm1', name: 'Ashara Mubarakah 1448H' },
  { id: 'm2', name: 'Chehlum Imam Husain 1448H' },
  { id: 'm3', name: 'Milad al-Nabi al-Adham 1448H' },
  { id: 'm4', name: 'Washeq Night Miqaat 1448H' }
];

export const DEFAULT_SHARAF_EVENTS: SharafEventDef[] = [
  { id: 'waaz', name: 'Waaz', isDefault: true },
  { id: 'qadambosi', name: 'Qadambosi', isDefault: true },
  { id: 'nikah', name: 'Nikah', isDefault: true },
  { id: 'misaq', name: 'Misaq', isDefault: true },
  { id: 'ziyafat', name: 'Ziyafat', isDefault: true }
];

export const INITIAL_SHARAF_ALLOCATIONS: SharafAllocation[] = [
  {
    id: 'alloc_1',
    itsNumber: '50412345',
    eventType: 'Waaz',
    waazZone: 'Masjid Sehan'
  },
  {
    id: 'alloc_2',
    itsNumber: '50412345',
    eventType: 'Nikah',
    location: 'Hazrat Aliyah Stage',
    fromTime: '10:00 AM',
    toTime: '12:00 PM'
  },
  {
    id: 'alloc_3',
    itsNumber: '30498765',
    eventType: 'Waaz',
    waazZone: 'Relay Center',
    mohalla: 'Shabbirabad / Shabbiri'
  },
  {
    id: 'alloc_4',
    itsNumber: '30498765',
    eventType: 'Qadambosi',
    location: 'VIP Annex Hall',
    fromTime: '04:30 PM',
    toTime: '06:00 PM'
  }
];

export const MOHALLA_OPTIONS = [
  'Saddar / Yusufi',
  'Shabbirabad / Shabbiri',
  'Saifee Nagar / Saifee',
  'Clifton / Ezzi',
  'North Nazimabad / Husaini',
  'Karimabad / Imadi',
  'Federal B Area / Badri',
  'Defence / DHA',
  'Bahadurabad / Burhani'
];

export const INITIAL_ZONES: Zone[] = [
  { id: 'z1', name: 'Karachi South (Taheri Masjid)', description: 'Main masjid compound and surrounding streets' },
  { id: 'z2', name: 'Saddar Zone (Burhani Masjid)', description: 'Auxiliary prayer hall and crowd control pathways' },
  { id: 'z3', name: 'Clifton / DHA', description: 'Secondary community centers and transport hubs' },
  { id: 'z4', name: 'Sahn-e-Masjid (Main Courtyard)', description: 'Central open-air courtyard coverage' },
  { id: 'z5', name: 'Mawaid-e-Saifee (Dining)', description: 'Dining halls and meal preparation areas' },
  { id: 'z6', name: 'Mazar-e-Qutbi (Spiritual Shrine)', description: 'Holy shrines and visiting pilgrim areas' },
  { id: 'z7', name: 'Al-Vazarat (Administrative)', description: 'Offices, registration, and security gates' }
];

export const INITIAL_TOPICS: Topic[] = [
  { id: 't1', name: 'Ashara Ohbat (Venue & Construction)', category: 'Preparation' },
  { id: 't2', name: 'Syedna (TUS) Arrival & Istiqbal', category: 'Milestone' },
  { id: 't3', name: 'Waaz Shareef (Sermon Coverage)', category: 'Core Event' },
  { id: 't4', name: 'Mumineen Devotion (Matam & Bukat)', category: 'Emotional Focus' },
  { id: 't5', name: 'Khidmat & Volunteers (Scouts & Medical)', category: 'Service' },
  { id: 't6', name: 'Mawaid Catering & Distribution', category: 'Support' },
  { id: 't7', name: 'Night Miqaats & Lailatul Qadr', category: 'Special Prayer' }
];

export const INITIAL_USERS: UserProfile[] = [
  // Admin Profile
  {
    itsNumber: '40486680',
    fullName: 'Sheikh Ibrahim Bhai Lokhandwala',
    fullNameAr: 'الشيخ إبراهيم بهائي لوكهند والا',
    role: 'admin',
    roles: ['admin'],
    mobile: '+92 321 4048668',
    email: 'ibrahim.lokhandwala@almusawareen.org',
    cityRaza: 'Karachi',
    cityDomicile: 'Mumbai',
    dateArrival: '2026-07-10',
    mohalla: 'Clifton / Ezzi',
    status: 'approved',
    sharafStatus: 'granted',
    sharafZone: 'Hazrat Aliyah',
    sharafSeat: 'Row A - Seat 1',
    createdAt: '2026-07-01T10:00:00Z'
  },
  // Dual-Role Photographer + HR Coordinator
  {
    itsNumber: '50412345',
    fullName: 'Taher Bhai Kotwala',
    fullNameAr: 'طاهر بهائي كوتوالا',
    role: 'photographer',
    roles: ['photographer', 'coordinator'],
    hrPermissions: {
      ...DEFAULT_HR_PERMISSIONS,
      starOverride: true,
    },
    mobile: '+91 98200 12345',
    email: 'taher.kotwala@gmail.com',
    cityRaza: 'Mumbai',
    cityDomicile: 'Mumbai',
    dateArrival: '2026-07-14',
    mohalla: 'Saddar / Yusufi',
    status: 'approved',
    sharafStatus: 'granted',
    sharafZone: 'Sahn-e-Masjid',
    sharafSeat: 'Zone B - Seat 14',
    createdAt: '2026-07-05T12:30:00Z'
  },
  // Videographer 1
  {
    itsNumber: '30498765',
    fullName: 'Mustafa Bhai Murshidawi',
    fullNameAr: 'مصطفى بهائي مرشداوي',
    role: 'videographer',
    roles: ['videographer'],
    mobile: '+971 50 123 4567',
    email: 'mustafa.murshid@live.com',
    cityRaza: 'Dubai',
    cityDomicile: 'Dubai',
    dateArrival: '2026-07-12',
    mohalla: 'Shabbirabad / Shabbiri',
    status: 'approved',
    sharafStatus: 'pending',
    sharafZone: 'Mawaid',
    createdAt: '2026-07-06T08:15:00Z'
  },
  // Coordinator 1 (HR Only)
  {
    itsNumber: '10488221',
    fullName: 'Husain Bhai Shabbir',
    fullNameAr: 'حسين بهائي شبير',
    role: 'coordinator',
    roles: ['coordinator'],
    hrPermissions: {
      ...DEFAULT_HR_PERMISSIONS,
      assignCoverage: true,
      viewAssignments: true,
      reviewSubmissions: true,
      starOverride: false,
      viewRoster: true,
      editRoster: false
    },
    mobile: '+44 7711 223344',
    email: 'husain.shabbir@almusawareen.org',
    cityRaza: 'London',
    cityDomicile: 'London',
    dateArrival: '2026-07-11',
    mohalla: 'Saifee Nagar / Saifee',
    status: 'approved',
    sharafStatus: 'none',
    createdAt: '2026-07-02T15:40:00Z'
  },
  // Pending Photographer Registration
  {
    itsNumber: '20455667',
    fullName: 'Abbas Bhai Gandhi',
    fullNameAr: 'عباس بهائي غاندي',
    role: 'photographer',
    roles: ['photographer'],
    mobile: '+92 333 5556677',
    email: 'abbas.gandhi@yahoo.com',
    cityRaza: 'Karachi',
    cityDomicile: 'Karachi',
    dateArrival: '2026-07-16',
    mohalla: 'North Nazimabad / Husaini',
    status: 'pending',
    sharafStatus: 'none',
    createdAt: '2026-07-19T18:22:00Z'
  },
  // Pending HR Coordinator Registration (to test HR Onboarding Flow)
  {
    itsNumber: '60477889',
    fullName: 'Mufaddal Bhai Kapasi',
    fullNameAr: 'مفضل بهائي كباسي',
    role: 'coordinator',
    roles: ['coordinator'],
    mobile: '+92 300 9988776',
    email: 'mufaddal.kapasi@gmail.com',
    cityRaza: 'Karachi',
    cityDomicile: 'Karachi',
    dateArrival: '2026-07-18',
    mohalla: 'Clifton / Ezzi',
    status: 'pending',
    sharafStatus: 'none',
    createdAt: '2026-07-20T09:10:00Z'
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    date: '2026-07-21',
    zone: 'Karachi South (Taheri Masjid)',
    topic: 'Waaz Shareef (Sermon Coverage)',
    topics: ['Waaz Shareef (Sermon Coverage)', 'Mumineen Arrival & Entrance', 'VIP Guests & Janab Dignitaries'],
    assignedUsers: ['50412345'],
    status: 'active'
  },
  {
    id: 'a2',
    date: '2026-07-21',
    zone: 'Mawaid-e-Saifee (Dining)',
    topic: 'Mawaid Catering & Distribution',
    topics: ['Mawaid Catering & Distribution', 'Kitchen Prep & Cooking', 'Scouts Coordination & Hygiene'],
    assignedUsers: ['30498765'],
    memberStatuses: { '30498765': 'declined' },
    memberDeclineReasons: { '30498765': 'Travel / Travel Conflict: Pre-scheduled flight during coverage hours.' },
    notes: 'Wide angles of the kitchen prep and the distribution line. Focus on clean presentation.',
    status: 'active'
  },
  {
    id: 'a3',
    date: '2026-07-20',
    zone: 'Sahn-e-Masjid (Main Courtyard)',
    topic: 'Mumineen Devotion (Matam & Bukat)',
    topics: ['Mumineen Devotion (Matam & Bukat)', 'Balcony Overview Angle', 'Syedna TUS Procession'],
    assignedUsers: ['50412345'],
    notes: 'High angle coverage from the balcony of the devotion and Matam sequence.',
    status: 'completed'
  },
  {
    id: 'a4',
    date: '2026-07-22',
    zone: 'Mazar-e-Qutbi (Spiritual Shrine)',
    topic: 'Ashara Ohbat (Venue & Construction)',
    topics: ['Ashara Ohbat (Venue & Construction)', 'Floral Decorations & Carpets'],
    assignedUsers: ['50412345', '30498765'],
    notes: 'Preparation of the floral decorations and carpets around the Mazar.',
    status: 'active'
  }
];

export const INITIAL_SUBMISSIONS: ShotReport[] = [
  {
    id: 's1',
    itsNumber: '50412345',
    userName: 'Taher Bhai Kotwala',
    assignmentId: 'a3',
    assignmentTitle: '2026-07-20 - Sahn-e-Masjid - Mumineen Devotion',
    driveLink: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345',
    timestamp: '2026-07-20T19:45:00Z',
    notes: 'Captured 45 select high-resolution images of Matam. Edited and exported.',
    completedTouchPoints: ['Mumineen Devotion (Matam & Bukat)', 'Balcony Overview Angle', 'Syedna TUS Procession'],
    grade: 'A-Excellent'
  },
  {
    id: 's2',
    itsNumber: '30498765',
    userName: 'Mustafa Bhai Murshidawi',
    assignmentId: 'a2',
    assignmentTitle: '2026-07-21 - Mawaid-e-Saifee - Mawaid Catering',
    driveLink: 'https://drive.google.com/drive/folders/2bCdEfGhIjKlMnOpQrStUvWxYz678901',
    timestamp: '2026-07-21T14:10:00Z',
    notes: 'Raw video footage of kitchen preparation. 4K 60fps.',
    completedTouchPoints: ['Mawaid Catering & Distribution', 'Kitchen Prep & Cooking'],
    redStarFlags: { assignmentCancelledFault: true },
    grade: 'Pending'
  }
];

export const MOCK_GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=800&auto=format&fit=crop',
    titleEn: 'Main Masjid Illumination',
    titleAr: 'إنارة المسجد الجامع',
    location: 'Karachi South',
    credit: 'Al Musawareen Archive'
  },
  {
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop',
    titleEn: 'Devotion of Mumineen',
    titleAr: 'خشوع المؤمنين',
    location: 'Sahn-e-Masjid',
    credit: 'Taher Kotwala'
  },
  {
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800&auto=format&fit=crop',
    titleEn: 'Community Khidmat',
    titleAr: 'خدمة المؤمنين',
    location: 'Saddar Zone',
    credit: 'Husain Shabbir'
  },
  {
    url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=800&auto=format&fit=crop',
    titleEn: 'Preparation & Architecture',
    titleAr: 'تحضيرات وعمارة الميقات',
    location: 'Taheri Masjid',
    credit: 'Al Musawareen Video Team'
  },
  {
    url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=800&auto=format&fit=crop',
    titleEn: 'Spiritual Shrines',
    titleAr: 'أعتاب طاهرة',
    location: 'Mazar-e-Qutbi',
    credit: 'Mustafa Murshid'
  },
  {
    url: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?q=80&w=800&auto=format&fit=crop',
    titleEn: 'Baitul Maal Support',
    titleAr: 'تنظيم بيت المال',
    location: 'Al-Vazarat',
    credit: 'Al Musawareen Archive'
  }
];
