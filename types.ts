
export enum UserRole {
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  TRAINEE = 'TRAINEE'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber: string;
  password: string;
  credits: number;
  profileImage?: string; // Base64 string
}

export interface ClassSession {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  trainerId: string;
  creatorId?: string; // ID of the user who created the class
}

export interface AttendanceRecord {
  id: string;
  traineeId: string;
  classId: string;
  status: 'BOOKED' | 'ATTENDED' | 'CANCELLED';
  method: 'SELF' | 'STAFF';
  timestamp: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export interface ActivityLog {
  id: string;
  traineeId: string;
  traineeName: string;
  className: string;
  location: string;
  date: string;
  time: string;
  method: 'SELF' | 'STAFF';
  type: 'BOOKING' | 'ATTENDANCE' | 'CANCELLATION' | 'REFUND' | 'PURCHASE';
  timestamp: number;
  amount?: number; // Price paid for purchases
}

export interface AppData {
  users: User[];
  classes: ClassSession[];
  attendance: AttendanceRecord[];
  packages: CreditPackage[];
  activityLogs: ActivityLog[];
}
