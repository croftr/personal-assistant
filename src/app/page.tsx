"use client";

import { useState, useEffect } from "react";
import { Receipt, Calculator, TrendingUp } from "lucide-react";
import { AssistantCard } from "@/components/common/AssistantCard";
import { ExpenseStatistics } from "@/components/expenses/ExpenseStatistics";

export default function Home() {
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
  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-8 text-white">
      <div className="max-w-5xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">

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
          <p className="text-2xl text-gray-300">How can I help you today?</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Assistant Cards */}
          <div className="md:col-span-2 grid md:grid-cols-2 gap-8">
            <AssistantCard
              title="Expense Processor"
              description="Process receipts and generate expense reports with AI"
              icon={Receipt}
              href="/expenses"
              iconColor="text-blue-400"
              iconBgColor="bg-blue-600/20"
            />

            <AssistantCard
              title="Accountant"
              description="Financial analysis, document processing, and reporting tools"
              icon={Calculator}
              href="/accountant"
              iconColor="text-purple-400"
              iconBgColor="bg-purple-600/20"
            />
          </div>

          {/* Expense Statistics */}
          <div className="md:col-span-1">
            <div className="glass rounded-2xl p-6 space-y-3 h-full">
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
        </div>

        {/* Footer Info */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold text-gray-200">About Your Personal Assistant</h3>
          <p className="text-sm text-gray-400">
            Your personal assistant is organized into specialized sub-assistants, each designed to help
            with specific tasks. Select an assistant above to get started.
          </p>
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-200">Expense Processor</p>
                <p className="text-xs text-gray-400">AI-powered receipt scanning, CSV reports, ZIP creation, and email distribution</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calculator className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-200">Accountant</p>
                <p className="text-xs text-gray-400">Document analysis, financial reporting, and automated email reports</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 pt-4">
          v2.0.0 • Personal Assistant Suite
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-pink-600/5 rounded-full blur-[120px] -z-10" />
    </main>
  );
}
