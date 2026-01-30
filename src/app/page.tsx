"use client";

import { useState, useEffect } from "react";
import { useAccountantData } from "@/hooks/use-accountant-data";
import { Receipt, Calculator, TrendingUp } from "lucide-react";
import { AssistantCard } from "@/components/common/AssistantCard";
import { ExpenseStatistics } from "@/components/expenses/ExpenseStatistics";

export default function Home() {
  const { financialYears } = useAccountantData();

  const [statistics, setStatistics] = useState<{
    total_reports: number;
    total_expenses: number;
    total_amount: number;
    categories: {
      meals: { count: number; amount: number };
      travel: { count: number; amount: number };
      accommodation: { count: number; amount: number };
      other: { count: number; amount: number };
    };
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Helper functions for progress bars
  const getCurrentFinancialYear = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();
    const year = now.getFullYear();

    // Financial year starts on April 6
    let financialYear: number;
    if (month < 3) {
      financialYear = year - 1;
    } else if (month === 3 && day < 6) {
      financialYear = year - 1;
    } else {
      financialYear = year;
    }

    return `${financialYear}/${(financialYear + 1).toString().slice(2)}`;
  };

  const getFinancialYearProgress = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // Determine which FY we're in and calculate start date
    let fyStartYear: number;
    if (month < 3 || (month === 3 && day < 6)) {
      fyStartYear = currentYear - 1;
    } else {
      fyStartYear = currentYear;
    }

    const fyStart = new Date(fyStartYear, 3, 6); // April 6
    const fyEnd = new Date(fyStartYear + 1, 3, 5, 23, 59, 59); // April 5 next year

    const totalDays = (fyEnd.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (now.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24);
    const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

    const daysRemaining = Math.ceil(totalDays - daysPassed);

    return { progress, daysRemaining, fyEnd };
  };

  const getCurrentFYEarnings = () => {
    const currentFY = getCurrentFinancialYear();
    const fyData = financialYears.find(fy => fy.financial_year === currentFY);
    return fyData ? fyData.total_taxable_pay : 0;
  };

  const getEarningsProgress = () => {
    const TARGET = 100000;
    const earnings = getCurrentFYEarnings();
    const progress = Math.min((earnings / TARGET) * 100, 100);
    const isOverTarget = earnings > TARGET;
    const isNearTarget = earnings > TARGET * 0.85 && earnings <= TARGET; // 85% threshold

    return {
      earnings,
      progress,
      isOverTarget,
      isNearTarget,
      remaining: Math.max(TARGET - earnings, 0),
      over: Math.max(earnings - TARGET, 0)
    };
  };

  useEffect(() => {
    const loadStatistics = async () => {
      setLoadingStats(true);
      try {
        const response = await fetch('/api/expense-reports?includeStatistics=true');
        if (response.ok) {
          const data = await response.json();
          setStatistics(data.statistics);
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStatistics();
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <div className="max-w-6xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 z-10">

        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img
                src="/logo.svg"
                alt="App Logo"
                className="relative w-32 h-32 md:w-40 md:h-40 animate-float"
              />
            </div>
          </div>
          <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Welcome, Rob
          </h1>
          <p className="text-2xl text-gray-300">Your AI Financial Command Center</p>
        </div>

        {/* Global Status Bars */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Financial Year Progress */}
          <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-blue-100 uppercase tracking-widest text-xs">Financial Year Progress</h3>
                <span className="text-xs text-blue-400 font-bold">{Math.round(getFinancialYearProgress().progress)}%</span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: isMounted ? `${getFinancialYearProgress().progress}%` : '0%' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-mono">
                <span>{getCurrentFinancialYear().split('/')[0]}</span>
                <span>{getFinancialYearProgress().daysRemaining} Days Left</span>
              </div>
            </div>
          </div>

          {/* Earnings Target */}
          <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-green-500/30 transition-colors">
            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-green-100 uppercase tracking-widest text-xs">Taxable Income Target</h3>
                <span className={`text-xs font-bold ${getEarningsProgress().isOverTarget ? 'text-red-400' :
                  getEarningsProgress().isNearTarget ? 'text-orange-400' :
                    'text-green-400'
                  }`}>
                  £{getEarningsProgress().earnings.toLocaleString('en-GB', { minimumFractionDigits: 0 })} / £100k
                </span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${getEarningsProgress().isOverTarget
                    ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-600'
                    : getEarningsProgress().isNearTarget
                      ? 'bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600'
                      : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600'
                    }`}
                  style={{ width: isMounted ? `${getEarningsProgress().isOverTarget ? 100 : getEarningsProgress().progress}%` : '0%' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-mono">
                <span>£0</span>
                <span>
                  {getEarningsProgress().isOverTarget ? 'Over Limit' : `${Math.round(getEarningsProgress().progress)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Assistant Cards */}

          <AssistantCard
            title="Expense Processor"
            description="Process receipts and generate expense reports with AI"
            icon={Receipt}
            href="/expenses"
            iconColor="text-blue-400"
            iconBgColor="bg-blue-600/20"
          />

          {/* Expense Statistics */}
          <div className="md:col-span-1">
            <div className="glass rounded-2xl p-6 space-y-3 h-full border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-gray-200">Expense Overview</h3>
              </div>
              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : statistics && statistics.total_reports > 0 ? (
                <ExpenseStatistics statistics={statistics} />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No expense data yet. Process some receipts to see your statistics!</p>
                </div>
              )}
            </div>
          </div>

          <AssistantCard
            title="Accountant"
            description="Financial analysis, document processing, and reporting tools"
            icon={Calculator}
            href="/accountant"
            iconColor="text-purple-400"
            iconBgColor="bg-purple-600/20"
          />



        </div>

        <div className="text-center text-xs text-gray-500 pt-12">
          v2.0.0 • Personal Assistant Suite
        </div>
      </div>

      {/* Simplified Background Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      {/* Central glow behind content */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[100px] -z-10" />
    </main>
  );
}
