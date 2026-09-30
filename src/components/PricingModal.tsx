import React, { useState } from 'react';
import { useMonetization } from '../context/MonetizationContext';
import {
  CREDIT_PACKAGES,
  SUBSCRIPTION_PLANS,
  API_COST_METRICS,
  FREE_TIER_LIMITS,
} from '../data/monetizationPlans';
import { CreditPackage, SubscriptionPlan } from '../types/monetization';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  Wallet,
  Clock,
  Coins,
  ArrowRight,
  Loader2,
  Receipt,
  Download,
  AlertCircle,
  HelpCircle,
  Check,
  Lock
} from 'lucide-react';

export const PricingModal: React.FC = () => {
  const {
    state,
    isPricingModalOpen,
    pricingModalTab,
    closePricingModal,
    processPayment,
  } = useMonetization();

  const [activeTab, setActiveTab] = useState<'credits' | 'plans' | 'usage' | 'history'>(
    pricingModalTab || 'credits'
  );

  // Checkout Flow State
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    priceINR: number;
    credits: number;
    type: 'credits' | 'subscription';
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [customerName, setCustomerName] = useState('Benjamin Creator');
  const [customerEmail, setCustomerEmail] = useState('creator@benjamin.ai');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [upiId, setUpiId] = useState('creator@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('883');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    receiptNumber: string;
    creditsAdded: number;
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync tab if opened with specific tab
  React.useEffect(() => {
    if (pricingModalTab) {
      setActiveTab(pricingModalTab);
    }
  }, [pricingModalTab]);

  if (!isPricingModalOpen) return null;

  const handleStartCheckout = (item: CreditPackage | SubscriptionPlan, type: 'credits' | 'subscription') => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      priceINR: item.priceINR,
      credits: 'credits' in item ? (item.credits + item.bonusCredits) : item.creditsMonthly,
      type,
    });
    setPaymentSuccess(null);
    setPaymentError(null);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isProcessing) return;

    try {
      setIsProcessing(true);
      setPaymentError(null);

      const res = await processPayment(selectedItem.id, paymentMethod, {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        cardLast4: paymentMethod === 'card' ? cardNumber.slice(-4) : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || 'Payment transaction failed');
      }

      setPaymentSuccess({
        receiptNumber: res.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
        creditsAdded: res.creditsAdded || selectedItem.credits,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setPaymentError(err.message || 'Payment could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFillDemoPayment = () => {
    if (paymentMethod === 'upi') {
      setUpiId('demo.creator@okaxis');
    } else if (paymentMethod === 'card') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvv('123');
    }
  };

  return (
    <div
      id="monetization-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="monetization-modal-card"
        className="bg-[#0e1013] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Header */}
        <div className="p-6 border-b border-white/5 bg-[#14171c]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  BENJAMIN.AI Plans & Credits
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    state.tier === 'vip'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : state.tier === 'pro'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {state.tier.toUpperCase()} TIER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Current Balance: <strong className="text-emerald-400 font-mono">{state.credits} Credits</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={closePricingModal}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (unless checkout is active) */}
        {!selectedItem && (
          <div className="flex items-center px-6 border-b border-white/5 bg-[#0a0b0d]/50 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('credits')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'credits'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Credit Packages (₹49, ₹99, ₹199)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'plans'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Premium Subscriptions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('usage')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'usage'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free Tier & API Usage Cost</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>Receipts ({state.transactions.length})</span>
            </button>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* =========================================
              CHECKOUT VIEW
             ========================================= */}
          {selectedItem ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {paymentSuccess ? (
                /* Payment Success Card */
                <div className="bg-[#14171c] border border-emerald-500/30 rounded-xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
                    <p className="text-xs text-slate-400">
                      Your order has been verified and your account updated.
                    </p>
                  </div>

                  <div className="bg-[#0a0b0d] p-4 rounded-xl border border-white/5 space-y-2 text-xs text-left font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt No:</span>
                      <span className="text-slate-300 font-bold">{paymentSuccess.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Item:</span>
                      <span className="text-slate-300">{selectedItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="text-emerald-400 font-bold">₹{selectedItem.priceINR}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credits Credited:</span>
                      <span className="text-emerald-400 font-bold">+{paymentSuccess.creditsAdded} Credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Balance:</span>
                      <span className="text-white font-bold">{state.credits} Credits</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(null);
                        closePricingModal();
                      }}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Return to Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(null);
                        setActiveTab('history');
                      }}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors cursor-pointer"
                    >
                      View Invoice Receipt
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment Gateway Input Form */
                <form onSubmit={handleExecutePayment} className="space-y-6">
                  {/* Order Summary Header */}
                  <div className="bg-[#14171c] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Selected Package
                      </span>
                      <div className="text-base font-bold text-white">{selectedItem.name}</div>
                      <div className="text-xs text-emerald-400 font-semibold">
                        +{selectedItem.credits} AI Credits included
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-white">
                        ₹{selectedItem.priceINR}
                      </div>
                      <div className="text-[10px] text-slate-500">Total payable (Incl. GST)</div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">
                      Select Payment Method
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'upi'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-[#14171c] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs">UPI / GPay / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-[#14171c] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs">Card / RuPay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('netbanking')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'netbanking'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-[#14171c] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building className="w-5 h-5" />
                        <span className="text-xs">Net Banking</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'wallet'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-[#14171c] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Wallet className="w-5 h-5" />
                        <span className="text-xs">Wallets</span>
                      </button>
                    </div>
                  </div>

                  {/* Method Details Input */}
                  <div className="bg-[#14171c] p-4 rounded-xl border border-white/5 space-y-4">
                    {paymentMethod === 'upi' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300">
                            Virtual Payment Address (UPI ID)
                          </label>
                          <button
                            type="button"
                            onClick={handleFillDemoPayment}
                            className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                          >
                            Fill demo UPI
                          </button>
                        </div>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. yourname@okhdfcbank or yourname@paytm"
                          className="w-full bg-[#0a0b0d] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                          required
                        />
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Instant UPI payment via Google Pay, PhonePe, Paytm, BHIM</span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300">
                            Card Information
                          </label>
                          <button
                            type="button"
                            onClick={handleFillDemoPayment}
                            className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                          >
                            Fill test card
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="Card Number"
                          className="w-full bg-[#0a0b0d] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM / YY"
                            className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                            required
                          />
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="CVV"
                            maxLength={4}
                            className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-300 block">
                          Select Bank
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full bg-[#0a0b0d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="State Bank of India">State Bank of India (SBI)</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    )}

                    {paymentMethod === 'wallet' && (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-300 block">
                          Select Wallet
                        </label>
                        <select
                          value={selectedWallet}
                          onChange={(e) => setSelectedWallet(e.target.value)}
                          className="w-full bg-[#0a0b0d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="Paytm">Paytm Wallet</option>
                          <option value="PhonePe">PhonePe Wallet</option>
                          <option value="Amazon Pay">Amazon Pay</option>
                          <option value="Mobikwik">Mobikwik</option>
                        </select>
                      </div>
                    )}

                    {/* Customer Email & Phone for receipt */}
                    <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Receipt Email</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Mobile Number</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="px-4 py-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      ← Back to packages
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>256-Bit SSL Encrypted</span>
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                            <span>Processing Secure Payment...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Pay Securely ₹{selectedItem.priceINR}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* =========================================
                TABS CONTENT
               ========================================= */
            <>
              {/* TAB 1: CREDIT PACKAGES (₹49, ₹99, ₹199) */}
              {activeTab === 'credits' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Instant Credit Packages</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Top up credits that never expire. Deducted per voiceover generation, chatbot prompt, or video render.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CREDIT_PACKAGES.map((pkg) => {
                      const totalCredits = pkg.credits + pkg.bonusCredits;
                      return (
                        <div
                          key={pkg.id}
                          className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                            pkg.popular
                              ? 'bg-gradient-to-b from-emerald-950/20 to-[#14171c] border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                              : pkg.bestValue
                              ? 'bg-gradient-to-b from-purple-950/20 to-[#14171c] border-purple-500/40 shadow-xl shadow-purple-500/10'
                              : 'bg-[#14171c] border-white/5 hover:border-white/15'
                          }`}
                        >
                          {pkg.popular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                              Most Popular
                            </span>
                          )}
                          {pkg.bestValue && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                              Best Value (16% Extra)
                            </span>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-base font-bold text-white">{pkg.name}</h4>
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                {pkg.tagline}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/5">
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-extrabold font-mono text-white">
                                  ₹{pkg.priceINR}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">one-time</span>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-semibold font-mono mt-0.5">
                                {totalCredits} Credits ({pkg.costPerCredit})
                              </div>
                            </div>

                            {/* Features list */}
                            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                              {pkg.features.map((feat, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-6">
                            <button
                              type="button"
                              onClick={() => handleStartCheckout(pkg, 'credits')}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                pkg.popular || pkg.bestValue
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95'
                                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                              }`}
                            >
                              <span>Buy for ₹{pkg.priceINR}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: PREMIUM SUBSCRIPTIONS */}
              {activeTab === 'plans' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Premium Subscriptions</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Unleash full creative power with unlimited voice synthesis, monthly video credits, and priority GPU queues.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                          plan.popular
                            ? 'bg-gradient-to-b from-emerald-950/20 to-[#14171c] border-emerald-500/50 shadow-xl'
                            : 'bg-gradient-to-b from-purple-950/20 to-[#14171c] border-purple-500/50 shadow-xl'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 right-6 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                            Recommended
                          </span>
                        )}
                        {plan.discountBadge && (
                          <span className="absolute -top-3 right-6 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                            {plan.discountBadge}
                          </span>
                        )}

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {plan.billingPeriod === 'yearly'
                                ? 'Billed annually (Equivalent to ₹333/month)'
                                : 'Flexible monthly billing, cancel anytime.'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-extrabold font-mono text-white">
                                ₹{plan.priceINR}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                /{plan.billingPeriod === 'yearly' ? 'year' : 'month'}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-400 font-semibold mt-1">
                              Includes {plan.creditsMonthly.toLocaleString()} AI Video & Live Voice Credits
                            </div>
                          </div>

                          <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                            {plan.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-6">
                          <button
                            type="button"
                            onClick={() => handleStartCheckout(plan, 'subscription')}
                            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
                          >
                            <span>Subscribe for ₹{plan.priceINR}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FREE TIER LIMITS & GEMINI API USAGE COST */}
              {activeTab === 'usage' && (
                <div className="space-y-6">
                  {/* Daily Free Limits Box */}
                  <div className="bg-[#14171c] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Daily Free Tier Allowances
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                        Resets daily at 00:00 UTC
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Voice TTS</span>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">
                          {state.dailyUsage.voiceGenerations} / {FREE_TIER_LIMITS.dailyVoiceGenerations}
                        </div>
                        <span className="text-[10px] text-emerald-400">
                          {Math.max(0, FREE_TIER_LIMITS.dailyVoiceGenerations - state.dailyUsage.voiceGenerations)} free left today
                        </span>
                      </div>

                      <div className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Gemini Chat</span>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">
                          {state.dailyUsage.chatMessages} / {FREE_TIER_LIMITS.dailyChatMessages}
                        </div>
                        <span className="text-[10px] text-emerald-400">
                          {Math.max(0, FREE_TIER_LIMITS.dailyChatMessages - state.dailyUsage.chatMessages)} free left today
                        </span>
                      </div>

                      <div className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Live Voice API</span>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">
                          {state.dailyUsage.liveVoiceMinutes} / {FREE_TIER_LIMITS.dailyLiveVoiceMinutes}m
                        </div>
                        <span className="text-[10px] text-emerald-400">
                          {Math.max(0, FREE_TIER_LIMITS.dailyLiveVoiceMinutes - state.dailyUsage.liveVoiceMinutes)}m free left today
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* API Usage Unit Economics Table */}
                  <div className="bg-[#14171c] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Gemini API Cost & Credit Mapping</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Transparent breakdown of underlying neural computation cost per operation.
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        1 Credit ≈ ₹0.28 - ₹0.49
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-slate-500">
                            <th className="pb-2">Feature & Model</th>
                            <th className="pb-2">Credit Cost</th>
                            <th className="pb-2">Est. Gemini API Cost</th>
                            <th className="pb-2">Free Daily Quota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {API_COST_METRICS.map((item, idx) => (
                            <tr key={idx} className="py-2.5">
                              <td className="py-2.5">
                                <div className="font-semibold text-white">{item.label}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{item.geminiModel}</div>
                              </td>
                              <td className="py-2.5">
                                <span className="bg-white/5 px-2 py-0.5 rounded font-mono text-emerald-400 font-bold">
                                  {item.creditCost} {item.creditCost === 1 ? 'Credit' : 'Credits'}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-slate-400">
                                ~₹{item.approxComputeCostINR.toFixed(4)} (${item.approxComputeCostUSD.toFixed(5)})
                              </td>
                              <td className="py-2.5 text-slate-400 font-mono">
                                {item.freeTierDailyLimit} / day
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BILLING HISTORY & RECEIPTS */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Order & Payment Receipts</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Download tax invoices and view payment confirmation history.
                      </p>
                    </div>
                  </div>

                  {state.transactions.length === 0 ? (
                    <div className="bg-[#14171c] border border-white/5 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                      <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                      <div className="text-xs font-semibold text-slate-300">No payment history yet</div>
                      <p className="text-[11px] text-slate-500">
                        When you purchase credits or subscribe, your invoices and receipts will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {state.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="bg-[#14171c] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{tx.itemName}</span>
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-mono">
                                {tx.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Invoice: {tx.receiptNumber} • {new Date(tx.timestamp).toLocaleString()} • Method: {tx.paymentMethod.toUpperCase()}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-bold font-mono text-emerald-400">
                                ₹{tx.amountINR}
                              </div>
                              <div className="text-[10px] text-slate-500">+{tx.creditsAdded} Credits</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const receiptText = `BENJAMIN.AI INVOICE RECEIPT\nReceipt: ${tx.receiptNumber}\nItem: ${tx.itemName}\nAmount: ₹${tx.amountINR}\nDate: ${new Date(tx.timestamp).toISOString()}\nStatus: PAID\nCustomer: ${tx.customerDetails?.name || 'Creator'}\nThank you for using BENJAMIN.AI!`;
                                const blob = new Blob([receiptText], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${tx.receiptNumber}.txt`;
                                a.click();
                              }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Download Receipt"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
