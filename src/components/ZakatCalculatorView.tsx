import React, { useState } from 'react';
import { ZakatState } from '../types';
import {
  Calculator,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Info,
  HelpCircle
} from 'lucide-react';

interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  goldPerGram: number;
  silverPerGram: number;
}

const CURRENCIES: Record<string, CurrencyRate> = {
  PKR: { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee', goldPerGram: 24500, silverPerGram: 310 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', goldPerGram: 85, silverPerGram: 1.10 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', goldPerGram: 80, silverPerGram: 1.05 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', goldPerGram: 68, silverPerGram: 0.88 },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', goldPerGram: 318, silverPerGram: 4.12 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', goldPerGram: 312, silverPerGram: 4.05 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', goldPerGram: 7200, silverPerGram: 92 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', goldPerGram: 115, silverPerGram: 1.50 }
};

export const ZakatCalculatorView: React.FC = () => {
  const [currency, setCurrency] = useState<string>('PKR');
  const [nisabBasis, setNisabBasis] = useState<'silver' | 'gold'>('silver');

  const curRate = CURRENCIES[currency] || CURRENCIES.PKR;

  const [goldPrice, setGoldPrice] = useState<number>(curRate.goldPerGram);
  const [silverPrice, setSilverPrice] = useState<number>(curRate.silverPerGram);

  // Asset values
  const [cashInHand, setCashInHand] = useState<number>(0);
  const [cashInBank, setCashInBank] = useState<number>(0);
  const [goldGrams24k, setGoldGrams24k] = useState<number>(0);
  const [goldGrams22k, setGoldGrams22k] = useState<number>(0);
  const [silverGrams, setSilverGrams] = useState<number>(0);
  const [sharesAndStocks, setSharesAndStocks] = useState<number>(0);
  const [businessGoods, setBusinessGoods] = useState<number>(0);
  const [moneyOwedToYou, setMoneyOwedToYou] = useState<number>(0);
  const [otherAssets, setOtherAssets] = useState<number>(0);

  // Deductible Liabilities
  const [shortTermDebts, setShortTermDebts] = useState<number>(0);
  const [billsDue, setBillsDue] = useState<number>(0);
  const [businessLiabilities, setBusinessLiabilities] = useState<number>(0);

  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Handle currency change -> update default prices
  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
    const target = CURRENCIES[newCode];
    if (target) {
      setGoldPrice(target.goldPerGram);
      setSilverPrice(target.silverPerGram);
    }
  };

  // Nisab threshold in grams
  const GOLD_NISAB_GRAMS = 87.48; // 7.5 Tolas
  const SILVER_NISAB_GRAMS = 612.36; // 52.5 Tolas

  const goldNisabValue = GOLD_NISAB_GRAMS * goldPrice;
  const silverNisabValue = SILVER_NISAB_GRAMS * silverPrice;
  const activeNisabThreshold = nisabBasis === 'silver' ? silverNisabValue : goldNisabValue;

  // Asset Totals
  const goldValue = goldGrams24k * goldPrice + goldGrams22k * (goldPrice * (22 / 24));
  const silverValue = silverGrams * silverPrice;
  const totalCash = (cashInHand || 0) + (cashInBank || 0);

  const totalZakatableAssets =
    totalCash +
    goldValue +
    silverValue +
    (sharesAndStocks || 0) +
    (businessGoods || 0) +
    (moneyOwedToYou || 0) +
    (otherAssets || 0);

  // Total Liabilities
  const totalLiabilities =
    (shortTermDebts || 0) + (billsDue || 0) + (businessLiabilities || 0);

  // Net Wealth
  const netZakatableWealth = Math.max(0, totalZakatableAssets - totalLiabilities);
  const isZakatObligatory = netZakatableWealth >= activeNisabThreshold;
  const zakatDue = isZakatObligatory ? netZakatableWealth * 0.025 : 0;

  const resetAllFields = () => {
    setCashInHand(0);
    setCashInBank(0);
    setGoldGrams24k(0);
    setGoldGrams22k(0);
    setSilverGrams(0);
    setSharesAndStocks(0);
    setBusinessGoods(0);
    setMoneyOwedToYou(0);
    setOtherAssets(0);
    setShortTermDebts(0);
    setBillsDue(0);
    setBusinessLiabilities(0);
  };

  const copySummary = () => {
    const text = `
=== AL-BAYAN ZAKAT SUMMARY ===
Currency: ${currency} (${curRate.symbol})
Nisab Basis: ${nisabBasis.toUpperCase()} (${nisabBasis === 'silver' ? '612.36g' : '87.48g'})
Nisab Threshold: ${curRate.symbol} ${Math.round(activeNisabThreshold).toLocaleString()}

Gross Zakatable Assets: ${curRate.symbol} ${Math.round(totalZakatableAssets).toLocaleString()}
- Cash in Hand & Bank: ${curRate.symbol} ${Math.round(totalCash).toLocaleString()}
- Gold & Silver Value: ${curRate.symbol} ${Math.round(goldValue + silverValue).toLocaleString()}
- Investments & Business Stock: ${curRate.symbol} ${Math.round((sharesAndStocks || 0) + (businessGoods || 0)).toLocaleString()}

Less Deductible Liabilities: ${curRate.symbol} ${Math.round(totalLiabilities).toLocaleString()}

Net Zakatable Wealth: ${curRate.symbol} ${Math.round(netZakatableWealth).toLocaleString()}
Status: ${isZakatObligatory ? 'ZAKAT IS OBLIGATORY' : 'BELOW NISAB THRESHOLD'}
Total Zakat Due (2.5%): ${curRate.symbol} ${Math.round(zakatDue).toLocaleString()}
==============================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Configuration */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Shariah Compliant · 2.5% (1/40th)
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">
              Integrated Zakat Calculator
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Calculate your annual Zakat according to classical Fiqh principles and Dr. Israr Ahmed's lectures on Infaq.
            </p>
          </div>

          {/* Currency & Nisab Basis Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-medium text-stone-900 dark:text-stone-100"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Nisab Standard
              </label>
              <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                <button
                  onClick={() => setNisabBasis('silver')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    nisabBasis === 'silver'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                  title="Silver Nisab (52.5 Tola = 612.36g) is most beneficial for the poor"
                >
                  Silver (Recommended)
                </button>
                <button
                  onClick={() => setNisabBasis('gold')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    nisabBasis === 'gold'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                  title="Gold Nisab (7.5 Tola = 87.48g)"
                >
                  Gold (87.48g)
                </button>
              </div>
            </div>

            <div className="space-y-1 self-end">
              <button
                onClick={resetAllFields}
                className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-medium flex items-center gap-1.5"
                title="Reset all inputs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Nisab Threshold Card */}
        <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">
              Active Nisab Threshold ({nisabBasis.toUpperCase()})
            </span>
            <div className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-stone-900 dark:text-white">
              {curRate.symbol} {Math.round(activeNisabThreshold).toLocaleString()}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              {nisabBasis === 'silver' ? '612.36 grams of silver' : '87.48 grams of gold'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">
              Gold Price / Gram ({currency})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-400 font-mono">{curRate.symbol}</span>
              <input
                type="number"
                value={goldPrice}
                onChange={(e) => setGoldPrice(Math.max(1, Number(e.target.value)))}
                className="w-full font-mono text-base font-semibold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md px-2 py-1"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Adjustable to your local market</p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">
              Silver Price / Gram ({currency})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-400 font-mono">{curRate.symbol}</span>
              <input
                type="number"
                value={silverPrice}
                onChange={(e) => setSilverPrice(Math.max(0.1, Number(e.target.value)))}
                className="w-full font-mono text-base font-semibold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md px-2 py-1"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Adjustable to your local market</p>
          </div>
        </div>
      </div>

      {/* Inputs & Calculation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Asset & Liability Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Cash & Liquid Wealth */}
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-xs">
            <h3 className="text-base font-semibold text-stone-900 dark:text-white flex items-center gap-2">
              <span>1. Cash & Bank Balances</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Cash in Hand & Wallets</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cashInHand || ''}
                    onChange={(e) => setCashInHand(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Bank Accounts (Savings/Current)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cashInBank || ''}
                    onChange={(e) => setCashInBank(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Gold & Silver */}
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                2. Gold & Silver (Jewelry, Bullion, Coins)
              </h3>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                Value: {curRate.symbol} {Math.round(goldValue + silverValue).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">24K Gold (Grams)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={goldGrams24k || ''}
                  onChange={(e) => setGoldGrams24k(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">22K Gold (Grams)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={goldGrams22k || ''}
                  onChange={(e) => setGoldGrams22k(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Silver (Grams)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={silverGrams || ''}
                  onChange={(e) => setSilverGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Investments, Business & Receivables */}
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-xs">
            <h3 className="text-base font-semibold text-stone-900 dark:text-white">
              3. Investments, Business Stock & Receivables
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Stocks, Shares & Mutual Funds</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={sharesAndStocks || ''}
                    onChange={(e) => setSharesAndStocks(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Trade Merchandise / Stock Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={businessGoods || ''}
                    onChange={(e) => setBusinessGoods(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Money Lent / Expected Receivables</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={moneyOwedToYou || ''}
                    onChange={(e) => setMoneyOwedToYou(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Other Zakatable Real Estate / Assets</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={otherAssets || ''}
                    onChange={(e) => setOtherAssets(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Deductible Liabilities */}
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-xs">
            <h3 className="text-base font-semibold text-stone-900 dark:text-white">
              4. Deductible Liabilities (Debts Due Now)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Short-Term Personal Debts</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={shortTermDebts || ''}
                    onChange={(e) => setShortTermDebts(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Overdue Bills / Rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={billsDue || ''}
                    onChange={(e) => setBillsDue(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400">Business Payables Due</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">{curRate.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={businessLiabilities || ''}
                    onChange={(e) => setBusinessLiabilities(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 font-mono text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculation Summary & Results */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                Zakat Assessment Summary
              </h3>
              <button
                onClick={copySummary}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs inline-flex items-center gap-1.5 transition-colors"
                title="Copy calculation receipt"
              >
                {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReceipt ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Total Zakatable Assets:</span>
                <span className="font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
                  {curRate.symbol} {Math.round(totalZakatableAssets).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Less Deductible Liabilities:</span>
                <span className="font-mono tabular-nums text-red-600 dark:text-red-400">
                  - {curRate.symbol} {Math.round(totalLiabilities).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-medium">
                <span className="text-stone-800 dark:text-stone-200">Net Zakatable Wealth:</span>
                <span className="font-mono tabular-nums font-bold text-base text-stone-900 dark:text-white">
                  {curRate.symbol} {Math.round(netZakatableWealth).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-stone-500 text-xs">
                <span>Nisab Threshold ({nisabBasis}):</span>
                <span className="font-mono tabular-nums">
                  {curRate.symbol} {Math.round(activeNisabThreshold).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Obligation Check & Big Display */}
            <div
              className={`p-6 rounded-xl border text-center space-y-2 transition-all ${
                isZakatObligatory
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-800/40'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                {isZakatObligatory ? (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Zakat is Obligatory
                  </span>
                ) : (
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Below Nisab Threshold
                  </span>
                )}
              </div>

              <div className="text-xs text-stone-500">
                {isZakatObligatory ? 'Total Zakat Payable (2.5%)' : 'No Zakat Due (Wealth < Nisab)'}
              </div>

              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-400">
                {curRate.symbol} {Math.round(zakatDue).toLocaleString()}
              </div>

              {isZakatObligatory && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-urdu pt-1">
                  "اور نماز قائم کرو اور زکوٰۃ ادا کرو" (سورۃ البقرۃ)
                </p>
              )}
            </div>

            {/* Masarif-e-Zakat: The 8 Eligible Categories */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Masarif-e-Zakat (Eligible Recipients - 9:60)
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-urdu">
                قرآن کریم کی سورۃ التوبہ (آیت 60) کے مطابق زکوٰۃ کے آٹھ مصارف ہیں: فقراء، مساکین، عاملین، مؤلفۃ القلوب، غلاموں کو آزاد کرانا، مقروضین، فی سبیل اللہ، اور مسافر۔
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
