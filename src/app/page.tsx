"use client";

import { Receipt, Calculator } from "lucide-react";
import { AssistantCard } from "@/components/common/AssistantCard";

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-8 text-white">
      <div className="max-w-5xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Welcome, Rob
          </h1>
          <p className="text-2xl text-gray-300">How can I help you today?</p>
        </div>

        {/* Assistant Cards */}
        <div className="grid md:grid-cols-2 gap-8">
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
