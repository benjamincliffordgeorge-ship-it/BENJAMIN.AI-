export type SubscriptionTier = 'free' | 'pro' | 'vip';

export interface CreditPackage {
  id: string;
  name: string;
  priceINR: number;
  credits: number;
  bonusCredits: number;
  popular?: boolean;
  bestValue?: boolean;
  costPerCredit: string;
  tagline: string;
  features: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceINR: number;
  billingPeriod: 'monthly' | 'yearly';
  creditsMonthly: number;
  discountBadge?: string;
  popular?: boolean;
  features: string[];
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  voiceGenerations: number;
  chatMessages: number;
  videoGenerations: number;
  liveVoiceMinutes: number;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  itemType: 'credits' | 'subscription';
  itemId: string;
  itemName: string;
  amountINR: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet';
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  receiptNumber: string;
  creditsAdded?: number;
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    upiId?: string;
    cardLast4?: string;
  };
}

export interface UserMonetizationState {
  tier: SubscriptionTier;
  credits: number;
  dailyUsage: DailyUsage;
  subscription?: {
    planId: string;
    planName: string;
    startDate: number;
    renewalDate: number;
    autoRenew: boolean;
  };
  transactions: PaymentTransaction[];
  apiCostTrackedUSD: number;
}

export interface ApiCostMetrics {
  feature: 'voice' | 'chat' | 'video' | 'live';
  label: string;
  creditCost: number;
  geminiModel: string;
  approxComputeCostUSD: number;
  approxComputeCostINR: number;
  freeTierDailyLimit: number;
  description: string;
}
