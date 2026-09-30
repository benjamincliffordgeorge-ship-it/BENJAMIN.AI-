import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserMonetizationState,
  SubscriptionTier,
  PaymentTransaction,
  DailyUsage,
} from '../types/monetization';
import {
  FREE_TIER_LIMITS,
  CREDIT_PACKAGES,
  SUBSCRIPTION_PLANS,
  API_COST_METRICS,
} from '../data/monetizationPlans';

interface MonetizationContextType {
  state: UserMonetizationState;
  isPricingModalOpen: boolean;
  pricingModalTab: 'credits' | 'plans' | 'usage' | 'history';
  limitAlert: { feature: 'voice' | 'chat' | 'video' | 'live'; limit: number; message: string } | null;
  openPricingModal: (tab?: 'credits' | 'plans' | 'usage' | 'history') => void;
  closePricingModal: () => void;
  closeLimitAlert: () => void;
  checkFeatureAllowance: (feature: 'voice' | 'chat' | 'video' | 'live') => {
    allowed: boolean;
    isFreeTier: boolean;
    remainingFree: number;
    requiresCredits: number;
    message?: string;
  };
  consumeFeatureUsage: (
    feature: 'voice' | 'chat' | 'video' | 'live',
    metadata?: { charCount?: number; tokenCount?: number; durationSeconds?: number }
  ) => Promise<boolean>;
  processPayment: (
    itemId: string,
    paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet',
    customerDetails: { name: string; email: string; phone?: string; upiId?: string; cardLast4?: string }
  ) => Promise<{ success: boolean; receiptNumber?: string; creditsAdded?: number; error?: string }>;
  resetDailyUsageManually: () => void;
}

const STORAGE_KEY = 'benjamin_ai_monetization_v1';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getInitialDailyUsage = (): DailyUsage => ({
  date: getTodayDateString(),
  voiceGenerations: 0,
  chatMessages: 0,
  videoGenerations: 0,
  liveVoiceMinutes: 0,
});

const getInitialState = (): UserMonetizationState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: UserMonetizationState = JSON.parse(saved);
      // Reset daily usage if new day
      const today = getTodayDateString();
      if (!parsed.dailyUsage || parsed.dailyUsage.date !== today) {
        parsed.dailyUsage = getInitialDailyUsage();
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not parse monetization state from localStorage:', e);
  }

  return {
    tier: 'free',
    credits: FREE_TIER_LIMITS.initialWelcomeCredits,
    dailyUsage: getInitialDailyUsage(),
    transactions: [],
    apiCostTrackedUSD: 0,
  };
};

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export const MonetizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserMonetizationState>(getInitialState);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalTab, setPricingModalTab] = useState<'credits' | 'plans' | 'usage' | 'history'>('credits');
  const [limitAlert, setLimitAlert] = useState<{
    feature: 'voice' | 'chat' | 'video' | 'live';
    limit: number;
    message: string;
  } | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed saving monetization state to localStorage:', e);
    }
  }, [state]);

  const openPricingModal = (tab: 'credits' | 'plans' | 'usage' | 'history' = 'credits') => {
    setPricingModalTab(tab);
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setIsPricingModalOpen(false);
  };

  const closeLimitAlert = () => {
    setLimitAlert(null);
  };

  const resetDailyUsageManually = () => {
    setState((prev) => ({
      ...prev,
      dailyUsage: getInitialDailyUsage(),
    }));
  };

  // Check if current user is allowed to perform operation
  const checkFeatureAllowance = useCallback(
    (feature: 'voice' | 'chat' | 'video' | 'live') => {
      const today = getTodayDateString();
      let currentUsage = state.dailyUsage;
      if (!currentUsage || currentUsage.date !== today) {
        currentUsage = getInitialDailyUsage();
      }

      const metric = API_COST_METRICS.find((m) => m.feature === feature);
      const creditCost = metric?.creditCost || 1;

      // Paid subscribers (Pro or VIP) have unlimited voice and high credits
      if (state.tier === 'pro' || state.tier === 'vip') {
        if (feature === 'voice') {
          return { allowed: true, isFreeTier: false, remainingFree: Infinity, requiresCredits: 0 };
        }
        // For video, chat, live: check credits
        const hasCredits = state.credits >= creditCost;
        return {
          allowed: hasCredits,
          isFreeTier: false,
          remainingFree: 0,
          requiresCredits: creditCost,
          message: hasCredits ? undefined : `Requires ${creditCost} credits. Current balance: ${state.credits}`,
        };
      }

      // Free Tier Logic
      let currentCount = 0;
      let dailyLimit = 10;

      switch (feature) {
        case 'voice':
          currentCount = currentUsage.voiceGenerations;
          dailyLimit = FREE_TIER_LIMITS.dailyVoiceGenerations;
          break;
        case 'chat':
          currentCount = currentUsage.chatMessages;
          dailyLimit = FREE_TIER_LIMITS.dailyChatMessages;
          break;
        case 'video':
          currentCount = currentUsage.videoGenerations;
          dailyLimit = FREE_TIER_LIMITS.dailyVideoGenerations;
          break;
        case 'live':
          currentCount = currentUsage.liveVoiceMinutes;
          dailyLimit = FREE_TIER_LIMITS.dailyLiveVoiceMinutes;
          break;
      }

      const remainingFree = Math.max(0, dailyLimit - currentCount);

      if (remainingFree > 0) {
        return {
          allowed: true,
          isFreeTier: true,
          remainingFree,
          requiresCredits: 0,
        };
      }

      // If free daily limit exceeded, user can use credits if they have any
      if (state.credits >= creditCost) {
        return {
          allowed: true,
          isFreeTier: false,
          remainingFree: 0,
          requiresCredits: creditCost,
        };
      }

      // Neither free allowance nor credits remaining
      return {
        allowed: false,
        isFreeTier: true,
        remainingFree: 0,
        requiresCredits: creditCost,
        message: `Daily free limit reached (${dailyLimit}/${dailyLimit}). Upgrade or add credits (from ₹49) to continue.`,
      };
    },
    [state]
  );

  // Consume usage upon successful action
  const consumeFeatureUsage = useCallback(
    async (
      feature: 'voice' | 'chat' | 'video' | 'live',
      metadata?: { charCount?: number; tokenCount?: number; durationSeconds?: number }
    ): Promise<boolean> => {
      const allowance = checkFeatureAllowance(feature);
      if (!allowance.allowed) {
        const metric = API_COST_METRICS.find((m) => m.feature === feature);
        setLimitAlert({
          feature,
          limit: metric?.freeTierDailyLimit || 10,
          message: allowance.message || 'Daily limit reached. Please top up credits or upgrade to Pro.',
        });
        return false;
      }

      const metric = API_COST_METRICS.find((m) => m.feature === feature);
      const creditCost = metric?.creditCost || 1;
      const today = getTodayDateString();

      // Send telemetry to server for Gemini compute cost accounting
      try {
        fetch('/api/usage/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature,
            units: 1,
            charCount: metadata?.charCount,
            tokenCount: metadata?.tokenCount,
            durationSeconds: metadata?.durationSeconds,
          }),
        }).catch((e) => console.warn('Usage tracking background log:', e));
      } catch (err) {}

      setState((prev) => {
        let daily = prev.dailyUsage;
        if (!daily || daily.date !== today) {
          daily = getInitialDailyUsage();
        }

        const updatedDaily: DailyUsage = { ...daily };
        let updatedCredits = prev.credits;

        // If user used free daily allowance, increment count
        if (allowance.isFreeTier && allowance.remainingFree > 0) {
          if (feature === 'voice') updatedDaily.voiceGenerations += 1;
          else if (feature === 'chat') updatedDaily.chatMessages += 1;
          else if (feature === 'video') updatedDaily.videoGenerations += 1;
          else if (feature === 'live') updatedDaily.liveVoiceMinutes += 1;
        } else if (allowance.requiresCredits > 0) {
          // Deduct from paid credits
          updatedCredits = Math.max(0, updatedCredits - creditCost);
        }

        const estComputeCostUSD = metric?.approxComputeCostUSD || 0.0001;

        return {
          ...prev,
          credits: updatedCredits,
          dailyUsage: updatedDaily,
          apiCostTrackedUSD: prev.apiCostTrackedUSD + estComputeCostUSD,
        };
      });

      return true;
    },
    [checkFeatureAllowance]
  );

  // Secure payment processor
  const processPayment = async (
    itemId: string,
    paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet',
    customerDetails: { name: string; email: string; phone?: string; upiId?: string; cardLast4?: string }
  ) => {
    try {
      // Step 1: Create Order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          paymentMethod,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order) {
        throw new Error(orderData.error || 'Failed to initialize payment order');
      }

      // Step 2: Verify Payment
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.order.orderId,
          itemId,
          paymentMethod,
          customerDetails,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      const tx: PaymentTransaction = verifyData.transaction;

      // Step 3: Update local state with new credits or subscription
      setState((prev) => {
        let newCredits = prev.credits + (tx.creditsAdded || 0);
        let newTier: SubscriptionTier = prev.tier;
        let newSub = prev.subscription;

        if (tx.itemType === 'subscription') {
          if (tx.itemId.includes('vip')) {
            newTier = 'vip';
          } else {
            newTier = 'pro';
          }
          const now = Date.now();
          const periodMs = tx.itemId.includes('yearly')
            ? 365 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;

          newSub = {
            planId: tx.itemId,
            planName: tx.itemName,
            startDate: now,
            renewalDate: now + periodMs,
            autoRenew: true,
          };
        }

        return {
          ...prev,
          tier: newTier,
          credits: newCredits,
          subscription: newSub,
          transactions: [tx, ...prev.transactions],
        };
      });

      return {
        success: true,
        receiptNumber: tx.receiptNumber,
        creditsAdded: tx.creditsAdded,
      };
    } catch (err: any) {
      console.error('Payment failed:', err);
      return {
        success: false,
        error: err.message || 'Payment processing failed. Please try again.',
      };
    }
  };

  return (
    <MonetizationContext.Provider
      value={{
        state,
        isPricingModalOpen,
        pricingModalTab,
        limitAlert,
        openPricingModal,
        closePricingModal,
        closeLimitAlert,
        checkFeatureAllowance,
        consumeFeatureUsage,
        processPayment,
        resetDailyUsageManually,
      }}
    >
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = (): MonetizationContextType => {
  const context = useContext(MonetizationContext);
  if (!context) {
    throw new Error('useMonetization must be used within a MonetizationProvider');
  }
  return context;
};
