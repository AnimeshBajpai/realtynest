export interface RunnerProfile {
  id: string;
  email: string;
  name: string;
  age?: number;
  weightKg?: number;
  experienceLevel: string;
  currentWeeklyKm?: number;
  currentPaceMinPerKm?: number;
  fitnessLevel?: number;
  xpPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  onboardingCompleted: boolean;
}

export interface RunningGoal {
  id: string;
  runnerId: string;
  goalType: 'distance' | 'time' | 'race' | 'consistency';
  targetDistance?: number;
  targetTime?: string;
  targetDate: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
}

export interface TrainingPlan {
  id?: string;
  runnerId?: string;
  weekNumber: number;
  startDate?: string;
  endDate?: string;
  activities?: PlannedActivity[];
  items?: PlannedActivity[];
  totalDistanceKm?: number;
  coachNotes?: string;
}

export interface PlannedActivity {
  id: string;
  dayOfWeek: number;
  activityType: string;
  distanceKm?: number;
  targetDistanceKm?: number;
  targetPaceMinPerKm?: number;
  targetDurationMin?: number;
  durationMinutes?: number;
  description?: string;
  completed?: boolean;
  status?: string;
}

export interface ActivityLog {
  id: string;
  runnerId: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  avgPaceMinPerKm: number;
  paceMinPerKm?: number;
  effortLevel: number;
  notes?: string;
  xpEarned: number;
  wasPlanned: boolean;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'distance' | 'streak' | 'speed' | 'consistency' | 'milestone';
  requirement: string;
  earned: boolean;
  earnedAt?: string;
}

export interface CoachMessage {
  id?: string;
  type?: 'greeting' | 'feedback' | 'encouragement' | 'plan_update';
  content?: string;
  message?: string;
  timestamp?: string;
}

export interface CheckInData {
  completedToday: boolean;
  actualDistanceKm?: number;
  actualDurationMinutes?: number;
  effortLevel?: number;
  notes?: string;
}

export interface OnboardingData {
  age?: number;
  weightKg?: number;
  experienceLevel: string;
  currentWeeklyKm?: number;
  currentPaceMinPerKm?: number;
  goalType: string;
  targetTime?: string;
  targetDate?: string;
}

export interface WeeklyPlanOverview {
  days: {
    dayOfWeek: number;
    label: string;
    activity?: PlannedActivity;
    isToday: boolean;
  }[];
}
