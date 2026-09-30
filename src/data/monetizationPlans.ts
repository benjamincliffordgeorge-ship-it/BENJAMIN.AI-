import { CreditPackage, SubscriptionPlan, ApiCostMetrics } from '../types/monetization';

export const FREE_TIER_LIMITS = {
  dailyVoiceGenerations: 10,
  dailyChatMessages: 20,
  dailyVideoGenerations: 2,
  dailyLiveVoiceMinutes: 3,
  initialWelcomeCredits: 25,
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits_49',
    name: 'Starter Pack',
    priceINR: 49,
    credits: 100,
    bonusCredits: 0,
    costPerCredit: '₹0.49/credit',
    tagline: 'Ideal for trying out neural voices and short video clips.',
    features: [
      '100 AI Studio Credits',
      'No expiration date',
      'Access to all Indian & Global voices',
      'Standard generation priority',
      'MP3, WAV & OGG Exports',
    ],
  },
  {
    id: 'credits_99',
    name: 'Creator Pack',
    priceINR: 99,
    credits: 250,
    bonusCredits: 25, // 275 total
    popular: true,
    costPerCredit: '₹0.36/credit',
    tagline: 'Most popular among content creators, reel makers & podcasters.',
    features: [
      '275 Total Credits (250 + 25 Bonus)',
      '10% Extra Bonus Credits',
      'No expiration date',
      'High-priority audio rendering',
      'Gemini Chat & Voice Hearing access',
      'Google Search Grounding unlocked',
    ],
  },
  {
    id: 'credits_199',
    name: 'Pro Studio Pack',
    priceINR: 199,
    credits: 600,
    bonusCredits: 100, // 700 total
    bestValue: true,
    costPerCredit: '₹0.28/credit',
    tagline: 'Maximum savings for studios and agency voiceover workflows.',
    features: [
      '700 Total Credits (600 + 100 Bonus)',
      '16% Extra Bonus Credits',
      'Lowest cost per credit (₹0.28)',
      'VIP priority queue for studio rendering',
      'Commercial broadcast usage rights',
      'Direct MP3, OGG & Lossless WAV downloads',
    ],
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'sub_pro_monthly',
    name: 'Pro Creator',
    tier: 'pro',
    priceINR: 499,
    billingPeriod: 'monthly',
    creditsMonthly: 1500,
    popular: true,
    features: [
      'Unlimited Voice TTS Generations',
      '1,500 Monthly Live & Advanced Credits',
      'AI Voice Hearing & Speech Transcriber',
      'Gemini Live Voice full-duplex conversations',
      'Gemini 3.1 Pro & 3.5 Flash with Search Grounding',
      'Zero ads or rate limits',
      'Commercial license for audio assets',
    ],
  },
  {
    id: 'sub_vip_yearly',
    name: 'Studio VIP Annual',
    tier: 'vip',
    priceINR: 3999,
    billingPeriod: 'yearly',
    creditsMonthly: 2500, // 20,000+ yearly
    discountBadge: 'Save 33%',
    features: [
      'Everything in Pro Creator',
      '20,000 Annual AI Studio Credits',
      'Ultra-fast dedicated GPU pipeline',
      'Direct API webhooks and bulk batch processing',
      'Early access to next-gen Gemini voice models',
      'Dedicated 24/7 technical VIP support',
      'Custom voice branding & priority feature requests',
    ],
  },
];

export const API_COST_METRICS: ApiCostMetrics[] = [
  {
    feature: 'voice',
    label: 'Voice TTS Generation',
    creditCost: 1,
    geminiModel: 'gemini-3.8-flash-lite-tts',
    approxComputeCostUSD: 0.0001,
    approxComputeCostINR: 0.0085,
    freeTierDailyLimit: FREE_TIER_LIMITS.dailyVoiceGenerations,
    description: 'Neural voice synthesis per generated audio clip (up to 5,000 characters).',
  },
  {
    feature: 'chat',
    label: 'Gemini Chat & Search',
    creditCost: 0.5,
    geminiModel: 'gemini-3.5-flash',
    approxComputeCostUSD: 0.000075,
    approxComputeCostINR: 0.0063,
    freeTierDailyLimit: FREE_TIER_LIMITS.dailyChatMessages,
    description: 'Multi-turn conversation and Google Search Grounding for scriptwriting.',
  },
  {
    feature: 'live',
    label: 'Gemini Live Voice Audio',
    creditCost: 2,
    geminiModel: 'gemini-3.8-live',
    approxComputeCostUSD: 0.003,
    approxComputeCostINR: 0.25,
    freeTierDailyLimit: FREE_TIER_LIMITS.dailyLiveVoiceMinutes,
    description: 'Real-time bidirectional 16kHz audio stream with low-latency neural synthesis.',
  },
];
