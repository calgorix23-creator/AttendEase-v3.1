
import { AppData, User, UserRole, CreditPackage, ClassSession, AttendanceRecord, ActivityLog } from '../types';

const STORAGE_KEY = 'attendease_v3_db';

const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@test.com', name: 'System Admin', role: UserRole.ADMIN, phoneNumber: '+6597638361', password: 'password123', credits: 0 },
  { id: 'u2', email: 'trainer@test.com', name: 'John Trainer', role: UserRole.TRAINER, phoneNumber: '+6597638362', password: 'password123', credits: 0 },
  { id: 'u3', email: 'trainee@test.com', name: 'Alice Trainee', role: UserRole.TRAINEE, phoneNumber: '+6597638363', password: 'password123', credits: 10 }
];

const MOCK_PACKAGES: CreditPackage[] = [
  { id: 'p1', name: 'Starter Pack', credits: 10, price: 180 },
  { id: 'p2', name: 'Value Pack', credits: 20, price: 300 },
  { id: 'p3', name: 'One-Time Pass', credits: 1, price: 30 }
];

const initialData: AppData = {
  users: MOCK_USERS,
  classes: [
    { id: 'c1', name: 'Morning Yoga', date: '2025-05-20', time: '08:00', location: 'Studio A', trainerId: 'u2', creatorId: 'u1' },
    { id: 'c2', name: 'HIIT Intensive', date: '2025-05-21', time: '18:30', location: 'Main Gym', trainerId: 'u2', creatorId: 'u1' }
  ],
  attendance: [],
  packages: MOCK_PACKAGES,
  activityLogs: []
};

class ApiService {
  private async load(): Promise<AppData> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      await this.save(initialData);
      return initialData;
    }
    return JSON.parse(data);
  }

  private async save(data: AppData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async getData(): Promise<AppData> {
    return await this.load();
  }

  async updateData(newData: AppData): Promise<AppData> {
    await this.save(newData);
    return newData;
  }

  async login(email: string, password: string): Promise<User | null> {
    const data = await this.load();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    return user || null;
  }

  async resetPassword(email: string, phoneNumber: string): Promise<boolean> {
    const data = await this.load();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.phoneNumber === phoneNumber);
    return !!user;
  }

  generateRandomPassword(): string {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const special = '!@#$%^&*';
    const all = lower + upper + nums + special;
    
    // Ensure at least one of each
    let pass = lower[Math.floor(Math.random() * lower.length)] +
               upper[Math.floor(Math.random() * upper.length)] +
               nums[Math.floor(Math.random() * nums.length)] +
               special[Math.floor(Math.random() * special.length)];
    
    for (let i = 4; i < 8; i++) {
      pass += all.charAt(Math.floor(Math.random() * all.length));
    }
    
    // Shuffle the result
    return pass.split('').sort(() => 0.5 - Math.random()).join('');
  }
}

export const api = new ApiService();
