export type WakeUpTaskType =
  | 'NONE'
  | 'MATH'
  | 'QR_SCAN'
  | 'PHOTO_SUNLIGHT'
  | 'WALK_STEPS'
  | 'SHAKE_PHONE'
  | 'BARCODE_SCAN'
  | 'TYPING_TEST';

export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type PenaltyDestination = 'SAVINGS' | 'CHARITY' | 'FRIEND';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type BattleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type TransactionType =
  | 'WALLET_TOPUP'
  | 'SNOOZE_PENALTY'
  | 'SAVINGS_WITHDRAWAL'
  | 'FRIEND_TRANSFER'
  | 'CHARITY_DONATION'
  | 'BATTLE_BET'
  | 'BATTLE_WIN'
  | 'REFUND';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  walletBalance: number;
  totalSnoozed: number;
  totalSaved: number;
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string | null;
  referralCode: string;
  timezone: string;
}

export interface Alarm {
  id: string;
  userId: string;
  label: string;
  time: string; // HH:mm
  daysOfWeek: number[];
  isEnabled: boolean;
  snoozeBasePenalty: number;
  useEscalatingPenalty: boolean;
  maxSnoozes: number;
  snoozeDurationMinutes: number;
  wakeUpTaskType: WakeUpTaskType;
  wakeUpTaskDifficulty: TaskDifficulty;
  penaltyDestination: PenaltyDestination;
  charityId: string | null;
  friendRecipientId: string | null;
  noEscapeMode: boolean;
  soundUrl: string | null;
  vibrationPattern: string | null;
}

export interface SnoozeEvent {
  id: string;
  alarmId: string;
  snoozedAt: string;
  penaltyAmount: number;
  snoozeNumber: number;
  platformFee: number;
  recipientAmount: number;
  destination: PenaltyDestination;
  status: PaymentStatus;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  platformFee: number;
  status: PaymentStatus;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  user: Pick<User, 'walletBalance' | 'totalSnoozed' | 'totalSaved' | 'currentStreak' | 'longestStreak' | 'streakStartDate'>;
  today: {
    snoozeCount: number;
    totalPenalty: number;
    moneySaved: number;
  };
  weekly: Record<string, { snoozeCount: number; penalty: number }>;
}
